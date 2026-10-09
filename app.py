from flask import Flask, render_template, request, jsonify
import os
import numpy as np
import librosa
import tensorflow as tf
import pickle

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# Load trained model
model = tf.keras.models.load_model(
    "model/voice_classification_model.keras"
)


# Load label encoder
with open("model/label_encoder.pkl", "rb") as file:
    label_encoder = pickle.load(file)


# Extract audio features
def extract_mfcc(file_path):

    audio, sr = librosa.load(
        file_path,
        sr=22050,
        duration=4
    )

    mfcc = librosa.feature.mfcc(
        y=audio,
        sr=sr,
        n_mfcc=40
    )

    MAX_LEN = 173

    if mfcc.shape[1] < MAX_LEN:

        pad_width = MAX_LEN - mfcc.shape[1]

        mfcc = np.pad(
            mfcc,
            ((0, 0), (0, pad_width)),
            mode="constant"
        )

    else:

        mfcc = mfcc[:, :MAX_LEN]

    mfcc = mfcc.astype("float32")

    mfcc = (
        mfcc - np.mean(mfcc)
    ) / (
        np.std(mfcc) + 1e-8
    )

    mfcc = mfcc[np.newaxis, ..., np.newaxis]

    return mfcc


# Home page
@app.route("/")
def home():

    return render_template("index.html")


# Prediction
@app.route("/predict", methods=["POST"])
def predict():

    if "audio" not in request.files:

        return jsonify({
            "error": "No audio file uploaded"
        }), 400

    audio_file = request.files["audio"]

    if audio_file.filename == "":

        return jsonify({
            "error": "No file selected"
        }), 400

    file_path = os.path.join(
        UPLOAD_FOLDER,
        audio_file.filename
    )

    audio_file.save(file_path)

    try:

        features = extract_mfcc(file_path)

        probabilities = model.predict(
            features,
            verbose=0
        )[0]

        top_indices = np.argsort(
            probabilities
        )[::-1][:3]

        best_index = top_indices[0]

        predicted_class = (
            label_encoder.inverse_transform(
                [best_index]
            )[0]
        )

        confidence = (
            probabilities[best_index] * 100
        )

        top_predictions = []

        for index in top_indices:

            class_name = (
                label_encoder.inverse_transform(
                    [index]
                )[0]
            )

            class_confidence = (
                probabilities[index] * 100
            )

            top_predictions.append({
                "class": class_name,
                "confidence": float(class_confidence)
            })

        return jsonify({
            "prediction": predicted_class,
            "confidence": float(confidence),
            "top_predictions": top_predictions
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if os.path.exists(file_path):
            os.remove(file_path)


if __name__ == "__main__":

    app.run(
        debug=True
    )