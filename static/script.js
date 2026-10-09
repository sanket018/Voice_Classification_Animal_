document.addEventListener("DOMContentLoaded", function () {

    const audioInput = document.getElementById("audioInput");
    const dropArea = document.getElementById("dropArea");
    const browseButton = document.getElementById("browseButton");

    const audioCard = document.getElementById("audioCard");
    const audioPlayer = document.getElementById("audioPlayer");

    const fileName = document.getElementById("fileName");
    const fileSize = document.getElementById("fileSize");

    const removeButton = document.getElementById("removeButton");
    const analyzeButton = document.getElementById("analyzeButton");

    const loadingBox = document.getElementById("loadingBox");
    const resultBox = document.getElementById("resultBox");

    const prediction = document.getElementById("prediction");
    const confidence = document.getElementById("confidence");
    const confidenceFill = document.getElementById("confidenceFill");

    const resultIcon = document.getElementById("resultIcon");
    const predictionList = document.getElementById("predictionList");

    let selectedFile = null;


    /* Browse button */

    browseButton.addEventListener("click", function (event) {

        event.stopPropagation();

        audioInput.click();

    });


    /* Upload box */

    dropArea.addEventListener("click", function () {

        audioInput.click();

    });


    /* File selected */

    audioInput.addEventListener("change", function () {

        if (this.files.length > 0) {

            handleFile(this.files[0]);

        }

    });


    /* Drag over */

    dropArea.addEventListener("dragover", function (event) {

        event.preventDefault();

        dropArea.classList.add("dragging");

    });


    /* Drag leave */

    dropArea.addEventListener("dragleave", function () {

        dropArea.classList.remove("dragging");

    });


    /* Drop */

    dropArea.addEventListener("drop", function (event) {

        event.preventDefault();

        dropArea.classList.remove("dragging");

        if (event.dataTransfer.files.length > 0) {

            handleFile(event.dataTransfer.files[0]);

        }

    });


    /* Handle audio */

    function handleFile(file) {

        if (!file.type.startsWith("audio/")) {

            alert("Please select an audio file.");

            return;

        }

        selectedFile = file;

        fileName.textContent = file.name;

        fileSize.textContent = formatFileSize(file.size);

        audioPlayer.src = URL.createObjectURL(file);

        audioCard.classList.add("show");

        resultBox.classList.remove("show");

        confidenceFill.style.width = "0%";

    }


    /* File size */

    function formatFileSize(bytes) {

        if (bytes < 1024) {

            return bytes + " B";

        }

        if (bytes < 1024 * 1024) {

            return (bytes / 1024).toFixed(1) + " KB";

        }

        return (bytes / (1024 * 1024)).toFixed(1) + " MB";

    }


    /* Remove */

    removeButton.addEventListener("click", function () {

        selectedFile = null;

        audioInput.value = "";

        audioPlayer.pause();

        audioPlayer.src = "";

        audioCard.classList.remove("show");

        resultBox.classList.remove("show");

    });


    /* Analyze */

    analyzeButton.addEventListener("click", async function () {

        if (!selectedFile) {

            alert("Please upload an audio file first.");

            return;

        }


        const formData = new FormData();

        formData.append("audio", selectedFile);


        analyzeButton.disabled = true;

        loadingBox.classList.add("show");

        resultBox.classList.remove("show");


        try {

            const response = await fetch("/predict", {

                method: "POST",

                body: formData

            });


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error || "Prediction failed"
                );

            }


            showResult(data);

        }

        catch (error) {

            console.error(error);

            alert(
                "Prediction Error: " + error.message
            );

        }

        finally {

            analyzeButton.disabled = false;

            loadingBox.classList.remove("show");

        }

    });


    /* Show result */

    function showResult(data) {

        const result = data.prediction || "Unknown";

        const score = Number(data.confidence || 0);


        prediction.textContent = result;

        confidence.textContent =
            score.toFixed(2) + "%";


        confidenceFill.style.width =
            Math.min(score, 100) + "%";


        resultIcon.textContent =
            getIcon(result);


        predictionList.innerHTML = "";


        if (
            data.top_predictions &&
            Array.isArray(data.top_predictions)
        ) {

            data.top_predictions.forEach(function (item) {

                const row =
                    document.createElement("div");

                row.className =
                    "prediction-row";


                const name =
                    document.createElement("span");

                name.textContent =
                    item.class;


                const track =
                    document.createElement("div");

                track.className =
                    "mini-track";


                const fill =
                    document.createElement("div");

                fill.className =
                    "mini-fill";


                fill.style.width =
                    Math.min(
                        Number(item.confidence),
                        100
                    ) + "%";


                track.appendChild(fill);


                const percent =
                    document.createElement("span");

                percent.textContent =
                    Number(item.confidence).toFixed(1)
                    + "%";


                row.appendChild(name);

                row.appendChild(track);

                row.appendChild(percent);


                predictionList.appendChild(row);

            });

        }


        resultBox.classList.add("show");

        resultBox.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }


    /* Icons */

    function getIcon(name) {

        const value =
            String(name).toLowerCase();


        if (
            value.includes("human") ||
            value.includes("person") ||
            value.includes("speech") ||
            value.includes("voice")
        ) {

            return "🧑";

        }


        if (
            value.includes("bird") ||
            value.includes("crow") ||
            value.includes("parrot") ||
            value.includes("eagle") ||
            value.includes("sparrow")
        ) {

            return "🐦";

        }


        if (
            value.includes("insect") ||
            value.includes("bee") ||
            value.includes("cricket") ||
            value.includes("mosquito")
        ) {

            return "🦋";

        }


        return "🐾";

    }

});