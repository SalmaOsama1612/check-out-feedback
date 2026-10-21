
const SUPABASE_URL = "https://eipindbabmrhssqwjars.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_DZ6Yh-kFAJoKjgiJgvhDlA_9ukkzhfY";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("feedbackForm");
    const submitButton = document.getElementById("submitButton");
    const formMessage = document.getElementById("formMessage");
    const successPanel = document.getElementById("successPanel");
    const anotherResponse = document.getElementById("anotherResponse");

    const progressText = document.getElementById("progressText");
    const progressFill = document.getElementById("progressFill");
    const progressBar = document.getElementById("progressBar");

    const comments = document.getElementById("comments");
    const charCount = document.getElementById("charCount");

    const requiredQuestions = [
        "overall_stay",
        "checkin_experience",
        "room_experience",
        "dining_experience",
        "recreation_experience",
        "team_care",
        "recommendation"
    ];

    let resetTimer = null;
    let isSubmitting = false;

    function showMessage(message, type = "error") {
        if (!formMessage) return;

        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
        formMessage.hidden = false;
    }

    function clearMessage() {
        if (!formMessage) return;

        formMessage.textContent = "";
        formMessage.hidden = true;
        formMessage.className = "form-message";
    }

    function updateProgress() {
        let answered = 0;

        requiredQuestions.forEach((questionName) => {
            const selected = form.querySelector(
                `input[name="${questionName}"]:checked`
            );

            if (selected) {
                answered++;
            }
        });

        const total = requiredQuestions.length;
        const percentage = Math.round((answered / total) * 100);

        if (progressText) {
            progressText.textContent = `${answered} of ${total} answered`;
        }

        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        if (progressBar) {
            progressBar.setAttribute("aria-valuenow", percentage);
        }
    }

    function updateCharacterCount() {
        if (!comments || !charCount) return;

        charCount.textContent = comments.value.length;
    }

    function setSubmitting(submitting) {
        isSubmitting = submitting;

        if (!submitButton) return;

        submitButton.disabled = submitting;

        const buttonText = submitButton.querySelector(
            "[data-submit-text]"
        );

        if (buttonText) {
            buttonText.textContent = submitting
                ? "Submitting..."
                : "Submit Feedback";
        } else {
            submitButton.textContent = submitting
                ? "Submitting..."
                : "Submit Feedback";
        }

        submitButton.setAttribute(
            "aria-busy",
            submitting ? "true" : "false"
        );
    }

    function showSuccessAndReset() {
        clearTimeout(resetTimer);

        form.hidden = true;
        successPanel.hidden = false;

        successPanel.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        resetTimer = setTimeout(() => {
            form.reset();

            form.hidden = false;
            successPanel.hidden = true;

            clearMessage();
            updateProgress();
            updateCharacterCount();

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.removeAttribute("aria-busy");

                const buttonText = submitButton.querySelector(
                    "[data-submit-text]"
                );

                if (buttonText) {
                    buttonText.textContent = "Submit Feedback";
                } else {
                    submitButton.textContent = "Submit Feedback";
                }
            }

            form.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 5000);
    }

    form.addEventListener("change", updateProgress);

    if (comments) {
        comments.addEventListener("input", updateCharacterCount);
    }

    if (anotherResponse) {
        anotherResponse.addEventListener("click", () => {
            clearTimeout(resetTimer);

            form.reset();
            clearMessage();
            updateProgress();
            updateCharacterCount();

            successPanel.hidden = true;
            form.hidden = false;

            form.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isSubmitting) return;

        clearMessage();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (!navigator.onLine) {
            showMessage(
                "No internet connection. Please reconnect and try again."
            );
            return;
        }

        const formData = new FormData(form);

        const feedback = {
            room_number: formData.get("room_number")?.trim() || null,
            stay_date: formData.get("stay_date") || null,

            overall_stay: formData.get("overall_stay"),
            checkin_experience: formData.get("checkin_experience"),
            room_experience: formData.get("room_experience"),
            dining_experience: formData.get("dining_experience"),
            recreation_experience: formData.get("recreation_experience"),
            team_care: formData.get("team_care"),

            comments: formData.get("comments")?.trim() || null,
            recommendation: Number(formData.get("recommendation"))
        };

        if (
            !requiredQuestions.every(
                (questionName) => formData.get(questionName) !== null
            )
        ) {
            showMessage(
                "Please answer all required questions before submitting."
            );
            updateProgress();
            return;
        }

        if (
            !Number.isInteger(feedback.recommendation) ||
            feedback.recommendation < 0 ||
            feedback.recommendation > 10
        ) {
            showMessage(
                "Please select a recommendation score from 0 to 10."
            );
            return;
        }

        try {
            setSubmitting(true);

            const { error } = await supabaseClient
                .from("guest_feedback")
                .insert([feedback]);

            if (error) {
                console.error("Supabase submission error:", error);

                showMessage(
                    "We couldn't submit your feedback. Please try again."
                );

                return;
            }

            showSuccessAndReset();
        } catch (error) {
            console.error("Unexpected submission error:", error);

            showMessage(
                "Something went wrong. Please check your connection and try again."
            );
        } finally {
            setSubmitting(false);
        }
    });

    updateProgress();
    updateCharacterCount();
});
