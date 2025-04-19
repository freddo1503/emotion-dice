#!/usr/bin/env python3
"""generate_feeling_images.py

Generate a vertical portrait image for every *leaf* feeling in a nested JSON tree.
(...truncated docstring...)
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

import requests
from openai import OpenAI, OpenAIError
from openai._exceptions import (
    BadRequestError,
    RateLimitError,
    APIConnectionError,
    APIStatusError,
)

import logging

# ---------------------------------------------------------------------------
# Configure logging (default at INFO, overridable by --log-level)
# ---------------------------------------------------------------------------
def setup_logger(level="INFO"):
    logging.basicConfig(
        level=getattr(logging, level, "INFO"),
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler()]
    )
    return logging.getLogger(__name__)

logger = setup_logger()  # default, may override in main()

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def flatten_feelings(node: Dict[str, Any], ancestors: List[str] | None = None) -> List[List[str]]:
    """Return a list of paths (list of names) to each *leaf* feeling."""
    ancestors = ancestors or []
    name = node["name"].strip()
    if "children" not in node or not node["children"]:
        return [ancestors + [name]]
    leaves: List[List[str]] = []
    for child in node["children"]:
        leaves.extend(flatten_feelings(child, ancestors + [name]))
    return leaves

def build_prompt(path: List[str], style: str, root_levels: int) -> str:
    """Compose the text prompt sent to the Images API."""
    relevant = path[-(root_levels + 1):] if root_levels >= 0 else path
    feeling_line = ", ".join(relevant)
    return (
        f"A vertical portrait photograph of a single human subject centered in the frame, "
        f"displaying a clearly recognizable expression of '{feeling_line}'. "
        "The emotional state must be immediately clear to viewers through facial expression and body language; "
        f"{style}. No text or lettering should appear in the image."
    )

def download_file(url: str, dest: Path, attempts: int = 3, backoff: float = 1.5) -> None:
    """Download *url* to *dest* with retries."""
    for i in range(1, attempts + 1):
        try:
            logger.debug(f"Attempting to download: {url} (attempt {i}/{attempts})")
            r = requests.get(url, timeout=30)
            r.raise_for_status()
            dest.write_bytes(r.content)
            logger.debug(f"Download succeeded: {dest}")
            return
        except requests.RequestException as e:
            logger.warning(f"Download failed ({e}) on attempt {i}")
            if i == attempts:
                logger.error(f"Giving up on download: {url}")
                raise
            time.sleep(backoff * i)

# ---------------------------------------------------------------------------
# Main generation routine
# ---------------------------------------------------------------------------

def generate_image_for_feeling(client: OpenAI, prompt: str, size: str, model: str) -> str:
    """Call the Images API and return the image URL."""
    logger.debug(f"Generating image for prompt: {prompt}")
    try:
        rsp = client.images.generate(model=model, prompt=prompt, n=1, size=size)
        url = rsp.data[0].url  # type: ignore[return-value]
        logger.debug(f"Image URL: {url}")
        return url
    except BadRequestError as exc:
        logger.error(f"Permanent failure from API: {exc}")
        raise RuntimeError(f"Permanent failure: {exc}") from exc
    except RateLimitError:
        logger.warning("Rate limit error encountered.")
        raise
    except (APIConnectionError, APIStatusError, OpenAIError) as exc:
        logger.error(f"API error: {exc}")
        raise

def process_path(path: List[str], args: argparse.Namespace, client: OpenAI) -> None:
    prompt = build_prompt(path, args.style, args.root_node_levels)
    relative = Path(*path)
    outfile = args.outdir / relative.with_suffix(".png")
    outfile.parent.mkdir(parents=True, exist_ok=True)

    if outfile.exists() and not args.force:
        logger.info(f"[skip] {relative}")
        return

    if args.dry_run:
        logger.info(f"[dry-run] {relative}: {prompt}")
        return

    retries = 0
    while retries <= args.retries:
        try:
            url = generate_image_for_feeling(client, prompt, args.size, args.model)
            download_file(url, outfile)
            logger.info(f"[ok]  {relative}")
            return
        except RateLimitError:
            wait = (retries + 1) * args.backoff
            logger.warning(f"[rate-limit] {relative} – retrying in {wait}s…")
            time.sleep(wait)
            retries += 1
        except RuntimeError as exc:
            logger.error(f"[err] {relative}: {exc}")
            return
        except Exception as exc:  # pylint: disable=broad-except
            logger.error(f"[err] {relative}: {exc}")
            return

# ---------------------------------------------------------------------------
# CLI entry‑point
# ---------------------------------------------------------------------------

def main(argv: List[str] | None = None) -> None:
    argv = argv if argv is not None else sys.argv[1:]

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("json_file", type=Path, help="Path to Feelings.json")
    parser.add_argument("--outdir", type=Path, default=Path("images"), help="Directory to save images")
    parser.add_argument("--size", default="1024x1024", choices=["1024x1024", "1024x1792", "1792x1024"],
                        help="Image size token accepted by the API (default: 1024x1792 portrait)")
    parser.add_argument("--model", default="dall-e-3", help="Image model (default: dall-e-3)")
    parser.add_argument("--style", default="cinematic", help="Extra words appended to the prompt to influence style")
    parser.add_argument("--root-node-levels", type=int, default=1,
                        help="How many parent category names to include in the prompt (−1 = all)")
    parser.add_argument("--max-workers", type=int, default=0,
                        help="Parallel threads (0 = sequential)")
    parser.add_argument("--retries", type=int, default=2, help="Retries on rate‑limit errors")
    parser.add_argument("--backoff", type=float, default=30.0, help="Seconds to backoff between retries (linear)")
    parser.add_argument("--force", action="store_true", help="Re‑download even if image file already exists")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts without calling the API")
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"],
                        help="Set log level (default: INFO)")

    args = parser.parse_args(argv)
    global logger
    logger = setup_logger(args.log_level)

    args.outdir = args.outdir.expanduser()
    args.outdir.mkdir(parents=True, exist_ok=True)

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        parser.error("OPENAI_API_KEY environment variable not set")
    client = OpenAI(api_key=api_key)

    try:
        data = json.loads(Path(args.json_file).read_text())
    except Exception as exc:
        parser.error(f"Failed to read JSON: {exc}")

    leaf_paths = flatten_feelings(data)
    logger.info(f"Found {len(leaf_paths)} leaf feelings …")

    if args.dry_run:
        for path in leaf_paths:
            logger.info(build_prompt(path, args.style, args.root_node_levels))
        logger.info("(dry‑run complete)")
        return

    if args.max_workers > 0:
        with cf.ThreadPoolExecutor(max_workers=args.max_workers) as pool:
            futs = [pool.submit(process_path, path, args, client) for path in leaf_paths]
            for fut in cf.as_completed(futs):
                fut.result()
    else:
        for path in leaf_paths:
            process_path(path, args, client)

    logger.info("Done.")

if __name__ == "__main__":
    main()