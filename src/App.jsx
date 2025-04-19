import { useEffect, useState, useCallback, memo } from "react";
import feelingsData from "./assets/Feelings.json";
import "./App.css";

/**
 * Minimal React component for picking a random emotion from the Feelings Wheel.
 */
function App() {
    const [emotions, setEmotions] = useState([]);
    const [emotion, setEmotion] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const flatten = (node) =>
            node.children ? node.children.flatMap(flatten) : [node.name];

        try {
            const flattenedEmotions = flatten(feelingsData);

            if (flattenedEmotions.length === 0) {
                throw new Error("No emotions found in the data");
            }

            setEmotions(flattenedEmotions);
            setError(null);
        } catch (err) {
            console.error("Error processing emotions data:", err);
            setError(err.message || "Failed to load emotions");
            // Fallback emotions
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
        setEmotion(emotions[randomIndex]);
    }, [emotions]);

    // Auto-pick an emotion when emotions are loaded
    useEffect(() => {
        if (emotions.length > 0 && !emotion) {
            pickEmotion();
        }
    }, [emotions, emotion, pickEmotion]);

    // 3 – Render the UI
    return (
        <main className="app-container">
            <h1 className="app-title">Emotion Picker</h1>

            {isLoading ? (
                <div className="loading-spinner" aria-label="Loading emotions data" />
            ) : error ? (
                <div className="error-message" role="alert">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    <div className="emotion-display">
                        {emotion || "No emotion picked yet"}
                    </div>
                    <button
                        className={`emotion-button ${emotion ? 'picked' : ''}`}
                        onClick={pickEmotion}
                        aria-label={
                            emotion
                                ? "Pick another emotion from the Feelings Wheel"
                                : "Pick a random emotion from the Feelings Wheel"
                        }
                        disabled={emotions.length === 0}
                    >
                        {emotion ? "Pick Another" : "Pick Emotion"}
                    </button>
                </>
            )}
        </main>
    );
}

export default memo(App);
