import { useEffect, useState, useCallback, memo } from "react";
import feelingsData from "./assets/Feelings.json";
import "./App.css";

/**
 * Function to find the path to the image for a given emotion
 * @param {string} emotionName - The name of the emotion to find
 * @param {Object} data - The feelings data object
 * @returns {string|null} - The path to the image or null if not found
 */
const findImagePath = (emotionName, data = feelingsData) => {
    // Base case: if this is the target emotion (leaf node)
    if (data.name === emotionName && !data.children) {
        // Find the parent and grandparent names by traversing up
        const pathParts = findPathParts(emotionName, feelingsData);
        if (pathParts) {
            // Make sure to use the correct path for images in the public directory
            // Use a relative path to ensure it works in all environments
            // Convert all path parts to lowercase
            const formattedPathParts = pathParts.map(part => {
                // Convert the entire path to lowercase
                // This matches our new lowercase directory structure
                // Replace spaces with hyphens for consistent naming
                return part.toLowerCase().replace(/ /g, '-');
            });
            const imagePath = `/images/${formattedPathParts.join('/')}.jpg`;
            console.log('Generated image path:', imagePath);
            return imagePath;
        }
        return null;
    }

    // If this node has children, search in them
    if (data.children) {
        // If this is the target emotion (but has children)
        if (data.name === emotionName) {
            return null; // We only want to show images for leaf emotions
        }

        // Search in children
        for (const child of data.children) {
            const path = findImagePath(emotionName, child);
            if (path) {
                return path;
            }
        }
    }

    return null;
};

/**
 * Function to find the path parts (parent, grandparent, etc.) for a given emotion
 * @param {string} emotionName - The name of the emotion to find
 * @param {Object} data - The feelings data object
 * @param {Array} path - The current path (used for recursion)
 * @returns {Array|null} - The path parts or null if not found
 */
const findPathParts = (emotionName, data, path = []) => {
    // If this is the target emotion
    if (data.name === emotionName && !data.children) {
        return [...path, data.name];
    }

    // If this node has children, search in them
    if (data.children) {
        const currentPath = [...path, data.name];

        for (const child of data.children) {
            const result = findPathParts(emotionName, child, currentPath);
            if (result) {
                return result;
            }
        }
    }

    return null;
};

/**
 * Minimal React component for picking a random emotion from the Feelings Wheel.
 */
function App() {
    const [emotions, setEmotions] = useState([]);
    const [emotion, setEmotion] = useState("");
    const [parentEmotion, setParentEmotion] = useState("");
    const [grandparentEmotion, setGrandparentEmotion] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imagePath, setImagePath] = useState(null);

    useEffect(() => {
        const flatten = (node) =>
            node.children ? node.children.flatMap(flatten) : [node.name];

        try {
            const flattenedEmotions = flatten(feelingsData);
            console.log("Flattened emotions:", flattenedEmotions);

            if (flattenedEmotions.length === 0) {
                throw new Error("No emotions found in the data");
            }

            setEmotions(flattenedEmotions);
            setError(null);
        } catch (err) {
            console.error("Error processing emotions data:", err);
            setError(err.message || "Failed to load emotions");
            setEmotions([
                "Happy",
                "Sad",
                "Angry",
                "Surprised",
                "Fearful",
                "Bad",
                "Disgusted",
            ]);
        } finally {
            setIsLoading(false);
        }
    }, []);


    // 2 – Handle picking a random emotion
    const pickEmotion = useCallback(() => {
        if (emotions.length === 0) return;
        const randomIndex = Math.floor(Math.random() * emotions.length);
        console.log("Picked emotion index:", randomIndex, "Emotion:", emotions[randomIndex]);
        setEmotion(emotions[randomIndex]);
    }, [emotions]);


    // Auto-pick an emotion when emotions are loaded
    useEffect(() => {
        if (emotions.length > 0 && !emotion) {
            pickEmotion();
        }
    }, [emotions, emotion, pickEmotion]);

    // Update image path, parent emotion, and grandparent emotion when emotion changes
    useEffect(() => {
        if (emotion) {
            const path = findImagePath(emotion, feelingsData);
            console.log("Updated emotion:", emotion, "Image path:", path);
            setImagePath(path);

            // Find parent and grandparent emotions
            const pathParts = findPathParts(emotion, feelingsData);
            if (pathParts && pathParts.length >= 2) {
                // pathParts contains [root, grandparent, parent, ..., emotion]
                // Get the second-to-last element (parent)
                const parent = pathParts[pathParts.length - 2];
                setParentEmotion(parent);
                console.log("Parent emotion:", parent);

                // Check if there's a grandparent (if path has at least 3 elements)
                if (pathParts.length >= 3) {
                    // Get the third-to-last element (grandparent)
                    const grandparent = pathParts[pathParts.length - 3];
                    setGrandparentEmotion(grandparent);
                    console.log("Grandparent emotion:", grandparent);
                } else {
                    setGrandparentEmotion("");
                }
            } else {
                setParentEmotion("");
                setGrandparentEmotion("");
            }
        } else {
            setImagePath(null);
            setParentEmotion("");
            setGrandparentEmotion("");
        }
    }, [emotion]);


    // 3 – Render the UI
    return (
        <main className="app-container">
            <h1 className="app-title">Emotion Dice</h1>
            <p className="app-subtitle">A tool for improv actors to explore emotional range and expression</p>

            {isLoading ? (
                <>
                    <div className="loading-spinner" aria-label="Loading emotions data" />
                    <p>Loading emotions...</p>
                </>
            ) : error ? (
                <div className="error-message" role="alert">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    <div className="emotion-container">
                        {imagePath && (
                            <div className="emotion-image-container">
                                <img
                                    src={imagePath}
                                    alt={`Image representing ${emotion}`}
                                    className="emotion-image"
                                    onError={(e) => {
                                        console.error(`Failed to load image: ${imagePath}`);
                                        e.target.style.display = 'none';
                                    }}
                                />
                                {/* Debug info hidden in production */}
                                <div className="debug-info">
                                    Image path: {imagePath}
                                </div>
                            </div>
                        )}
                        <div className="emotion-display">
                            {emotion ? (
                                <>
                                    {grandparentEmotion && (
                                        <div className="grandparent-emotion">
                                            {grandparentEmotion}
                                        </div>
                                    )}
                                    {parentEmotion && (
                                        <div className="parent-emotion">
                                            {parentEmotion}
                                        </div>
                                    )}
                                    {emotion}
                                </>
                            ) : (
                                "Ready to explore emotions"
                            )}
                        </div>
                        <button
                            className={`emotion-button ${emotion ? 'picked' : ''}`}
                            onClick={pickEmotion}
                            aria-label={
                                emotion
                                    ? "Roll the emotion dice again"
                                    : "Roll the emotion dice"
                            }
                            disabled={emotions.length === 0}
                        >
                            {emotion ? "Roll Again" : "Roll the Dice"}
                        </button>
                    </div>
                    <p className="emotion-context">
                        {emotion ? 
                            parentEmotion && grandparentEmotion ? 
                                `How would you express "${emotion}" (a type of ${parentEmotion}, which is a type of ${grandparentEmotion}) in a scene? Consider body language, tone, and facial expressions.` : 
                                parentEmotion ? 
                                    `How would you express "${emotion}" (a type of ${parentEmotion}) in a scene? Consider body language, tone, and facial expressions.` : 
                                    `How would you express "${emotion}" in a scene? Consider body language, tone, and facial expressions.`
                            : 
                            "Click the button above to discover an emotion to portray in your improv exercise."
                        }
                    </p>

                    <div className="emotion-info">
                        <p>This tool randomly selects from {emotions.length} different emotions to help improv performers practice emotional range and add spontaneity to exercises.</p>
                    </div>
                </>
            )}
        </main>
    );
}

export default memo(App);
