console.log("script is running");
import faqData from "./faqData.js";
import responses from "./response.js";

let stopRequested = false;
let isVideoPlaying = false;
let isttsPlaying = false;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isUserInteracted = false;
let displayTimeout;
let userMessage;
let timeoutID = null;
let safari = false;
let currentAudio = null;

let buffer;

// const userInput = document.getElementById("user-input");
const welcomeDialog = document.getElementById("welcome-dialog");
const botMessageElem = document.createElement("p");
const chatLog = document.getElementById("chat-log");
const ttsVideo = document.getElementById("tts-video");
const welcomeVideo = document.getElementById("welcome-video");
const isOtherQuestionVideo = document.getElementById("is-other-question-video");
const isOtherQuestionDialog = document.getElementById("dialog");
const wantToBeBahaiVideo = document.getElementById("want-to-be-bahai");
const wantToBeBahaiDialog = document.getElementById("want-to-be-bahai-dailog");
const thankYouBahai = document.getElementById("thankYouBahaiVideo");
const bottomContainer = document.getElementById("bottom-container");
const stopbtn = document.getElementById("stopMessagebtn");
const faqToggleBtn = document.getElementById("faq-toggle-btn");
const faqContainer = document.getElementById("faq-container");
const faqTypes = document.getElementById("faq-types");

faqToggleBtn.disabled = true;

faqToggleBtn.addEventListener("click", () => {
  faqContainer.classList.toggle("hidden");

  chatLog.classList.toggle("block");
});

function renderFaq() {
  Object.keys(faqData).forEach((type) => {
    const typeContainer = document.createElement("div");
    typeContainer.classList.add("faq-type", "border-b", "pb-2");

    // Type button
    const typeButton = document.createElement("button");
    typeButton.classList.add(
      "block",
      "text-medium",
      "font-bold",
      "text-right",
      "w-full",
      "px-2",
      "py-2",
      "bg-[#bb9b49]",
      "hover:bg-[#a2790d]",
      "rounded",
      "flex",
      "justify-between",
      "items-center"
    );

    // Add the icon element
    const icon = document.createElement("span");
    icon.classList.add("fas", "fa-plus"); // Initially show the "plus" icon for collapsed state
    typeButton.appendChild(icon);

    // Type text
    const typeText = document.createElement("span");

    const formattedType = type.replace(/([A-Z])/g, " $1").trim();
    typeText.textContent =
      formattedType.charAt(0).toUpperCase() + formattedType.slice(1);
    typeButton.appendChild(typeText);

    // Questions container (hidden by default)
    const questionList = document.createElement("div");
    questionList.classList.add(
      "questions",
      "hidden",
      "text-sm",
      "ml-6",
      "mt-2",
      "space-y-2"
    );

    // Create buttons for each question
    faqData[type].forEach((question) => {
      const questionElement = document.createElement("button");
      questionElement.classList.add(
        "block",
        "text-left",
        "w-full",
        "px-3",
        "text-medium",
        "py-2",
        "bg-[#bb9b49]",
        "hover:bg-[#a2790d]",
        "rounded"
      );
      questionElement.textContent = question;

      questionElement.onclick = () => sendMessage(question);
      questionList.appendChild(questionElement);
    });

    typeButton.addEventListener("click", () => {
      const isHidden = questionList.classList.contains("hidden");

      document
        .querySelectorAll(".questions")
        .forEach((q) => q.classList.add("hidden"));
      document
        .querySelectorAll(".fixed-type")
        .forEach((el) => el.classList.remove("fixed-type"));

      document
        .querySelectorAll(".faq-type span.fas")
        .forEach((i) => i.classList.replace("fa-minus", "fa-plus"));

      if (isHidden) {
        typeButton.classList.add("fixed-type");

        questionList.classList.remove("hidden");

        icon.classList.replace("fa-plus", "fa-minus");
      } else {
        questionList.classList.add("hidden");
        typeButton.classList.remove("fixed-type");
        icon.classList.replace("fa-minus", "fa-plus");
      }
    });

    typeContainer.appendChild(typeButton);
    typeContainer.appendChild(questionList);
    faqTypes.appendChild(typeContainer);
  });
}

renderFaq();

function handleVideoLoadFailure(videoElement) {
  console.error(`Failed to load video: ${videoElement.id}`);
  const maxRetries = 3;
  const currentRetries = parseInt(videoElement.dataset.retryCount || '0');
  
  if (currentRetries < maxRetries) {
    videoElement.dataset.retryCount = currentRetries + 1;
    console.log(`Retrying video load (${currentRetries + 1}/${maxRetries})`);

    const source = videoElement.querySelector('source');
    if (source) {
      const currentSrc = source.src;
      source.src = '';
      videoElement.load();
      setTimeout(() => {
        source.src = currentSrc;
        videoElement.load();
      }, 1000);
    }
  } else {
    console.log('Maximum retries reached, reloading page...');
    location.reload();
  }
}

function optimizeVideo(videoElement) {
  if (!videoElement) return;
  
  const source = videoElement.querySelector('source');
  if (source) {
    source.addEventListener('error', (e) => {
      handleVideoLoadFailure(videoElement);
    });
  }

  videoElement.addEventListener('error', (e) => {
    handleVideoLoadFailure(videoElement);
  });

  videoElement.setAttribute('preload', 'auto');
  videoElement.setAttribute('playsinline', '');
  videoElement.setAttribute('webkit-playsinline', '');
  
  const videoPath = videoElement.querySelector('source').src;
  fetch(videoPath, { method: 'HEAD' })
    .then(response => {
      if (!response.ok) {
        console.error(`Video file not found: ${videoPath}`);
        handleVideoLoadFailure(videoElement);
      }
    })
    .catch(error => {
      console.error(`Error checking video file: ${videoPath}`, error);
      handleVideoLoadFailure(videoElement);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    optimizeVideo(video);
    if (video.id === 'welcome-video') {
      detectSafariAndAutoplay(video);
    }
  });
});

function detectSafariAndAutoplay(videoElement) {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  if (isSafari) {
    videoElement.addEventListener('canplaythrough', () => {
      try {
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Autoplay was prevented:', error);
          });
        }
      } catch (error) {
        console.error('Error playing video:', error);
      }
    });
  }
}

document
  .getElementById("welcome-dialog")
  .addEventListener("click", handleInteraction);

function handleInteraction() {
  console.log("hendleinteraction function is running");
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  if (stopRequested) return;
  faqToggleBtn.disabled = false;

  chatLog.style.display = "block";
  welcomeDialog.classList.add("hidden");
  bottomContainer.classList.remove("opacity-50");
  bottomContainer.classList.add("opacity-100");
  welcomeVideo.muted = false;
  welcomeVideo.play();
  const promptElem = document.createElement("p");
  promptElem.className = "bot";
  const text =
    "مرحباً، أنا مايا، مساعدتك الذكية. يمكنك أن تسألني أي شيء عن الديانة البهائية.";
  const words = text.split(" ");

  chatLog.appendChild(promptElem);
  stopRequested = false;
  let wordIndex = 0;

  function displayWordByWord() {
    if (stopRequested || wordIndex < words.length) {
      promptElem.innerHTML += words[wordIndex] + " ";
      scrollToBottom(); 
      wordIndex++;

      displayTimeout = setTimeout(displayWordByWord, 300);
    }
  }

  displayWordByWord();
  isUserInteracted = true;
}
let autoScrollEnabled = true;

// Disable auto-scroll on touch for mobile
chatLog.addEventListener("touchstart", () => {
  autoScrollEnabled = false;
});

// Re-enable auto-scroll when the user lifts their finger on mobile
chatLog.addEventListener("touchend", () => {
  autoScrollEnabled = true;
});

// Disable auto-scroll on hover for desktop
chatLog.addEventListener("mouseover", () => {
  autoScrollEnabled = false;
});

// Re-enable auto-scroll when mouse leaves the chatbox on desktop
chatLog.addEventListener("mouseout", () => {
  autoScrollEnabled = true;
});

// Auto-scroll function
function scrollToBottom() {
  if (autoScrollEnabled) {
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}

function formatResponseText(text) {
  return text.replace(/(\d+\.)/g, "<br>$1"); // Add line break before each numbered point
}

stopbtn.addEventListener("click", stopTextAndTTS);
function stopTextAndTTS() {
  if (!isUserInteracted) return;
  stopRequested = true;
  console.log("stop text and tts");
  faqToggleBtn.disabled = false;
  stopbtn.classList.add("hidden");
  // Clear buffer if present
  if (buffer) {
    console.log("buffer present", ttsChunk);
    buffer = "";
    chunk = "";
  }

  // Stop current audio and hide video
  if (currentAudio) {
    currentAudio.pause(); // Pause the audio
    currentAudio = null; // Reset current audio
    ttsVideo.pause(); // Stop the video
    // ttsVideo.classList.add("hidden"); // Hide the video
  }
  //   hideAllVideos();
  // Handle stopping text-to-speech and other UI updates
  if (timeoutID !== null) {
    clearTimeout(timeoutID);
    timeoutID = null; // Reset the ID
  }

  clearTimeout(displayTimeout);
  isOtherQuestionVideo.classList.add("hidden");
  if (welcomeVideo) {
    welcomeVideo.pause();
  }
  timeoutID = setTimeout(whatisnextques, 4000);
}
async function sendMessage(userMessage) {
  faqContainer.classList.toggle("hidden");
  stopRequested = false;

  console.log("timeoutID when message sent :", timeoutID);

  if (timeoutID !== null) {
    clearTimeout(timeoutID);
    timeoutID = null;
  }

  faqToggleBtn.disabled = true;
  stopbtn.classList.remove("hidden");
  isOtherQuestionDialog.classList.add("hidden");
  wantToBeBahaiDialog.classList.add("hidden");
  chatLog.style.display = "block";
  const userMessageElem = document.createElement("p");
  userMessageElem.className = "user";

  userMessageElem.textContent = userMessage;
  chatLog.appendChild(userMessageElem);

  scrollToBottom();
  displayResponses(userMessage);
}

async function displayResponses(question) {
  // Stop any ongoing response before starting a new one
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  stopRequested = true;

  const response = responses[question];
  console.log("questions : ", question);
  console.log("response", response);
  if (!response) {
    console.warn("No response found for this question.");
    return;
  }

  const chat = document.getElementById("chat");

  const answerContainer = document.createElement("p");
  answerContainer.className = "bot";

  // Set a flag for new streaming and play audio
  stopRequested = false;
  await Promise.all([
    streamTextResponse(formatResponseText(response.answer), answerContainer),
    playAudioResponse(response.audio_file),
  ]);
}

async function streamTextResponse(text, answerContainer) {
  let result = "";

  // Iterate through each word but check if we need to stop streaming
  for (const word of text.split(" ")) {
    if (stopRequested) return; // Stop if a new question was selected
    result += word + " ";
    answerContainer.innerHTML = result.trim();

    chatLog.appendChild(answerContainer);
    scrollToBottom();
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

function hideAllVideos() {
  // Hide all video elements
  welcomeVideo.classList.add("hidden");
  ttsVideo.classList.add("hidden");
  isOtherQuestionVideo.classList.add("hidden");
  wantToBeBahaiVideo.classList.add("hidden");
  thankYouBahai.classList.add("hidden");
}
async function playAudioResponse(audioUrl) {
  return new Promise((resolve) => {
    const audio = new Audio(audioUrl);
    currentAudio = audio; // Set current audio instance

    // Show the video when audio starts playing
    setTimeout(() => {
      hideAllVideos();
      ttsVideo.classList.remove("hidden");
      ttsVideo.play(); // Start playing the video after 2 seconds
      ttsVideo.muted = true; // Ensure video is not muted
    }, 600); // 2-second delay

    // Play audio
    audio.play();

    // Pause video when audio is paused
    audio.onpause = () => {
      ttsVideo.pause();
    };

    // Stop video and hide it when audio ends
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      ttsVideo.pause();
      stopbtn.classList.add("hidden");
      faqToggleBtn.disabled = false;
      timeoutID = setTimeout(whatisnextques, 4000);
      resolve();
    };

    // Handle audio error
    audio.onerror = () => {
      currentAudio = null;
      ttsVideo.pause(); // Stop the video on error
      //   ttsVideo.classList.add("hidden"); // Hide the video on error
      resolve();
    };
  });
}

function whatisnextques() {
  const promptElem = document.createElement("p");
  promptElem.className = "bot";
  promptElem.textContent = "ما هو سؤالك التالي؟";

  chatLog.appendChild(promptElem);
  chatLog.scrollTop = chatLog.scrollHeight;
  if (!ttsVideo.classList.contains("hidden")) {
    ttsVideo.classList.add("hidden");
  }
  if (!wantToBeBahaiVideo.classList.contains("hidden")) {
    wantToBeBahaiVideo.classList.add("hidden");
  }
  if (!thankYouBahai.classList.contains("hidden")) {
    thankYouBahai.classList.add("hidden");
  }
  if (!isOtherQuestionVideo.classList.contains("hidden")) {
    isOtherQuestionVideo.classList.add("hidden");
  }
  if (!wantToBeBahaiDialog.classList.contains("hidden")) {
    wantToBeBahaiDialog.classList.add("hidden");
  }

  playOtherQuestionVideo();

  //   promptShown = true;
}
function playOtherQuestionVideo() {
  welcomeVideo.classList.add("hidden");
  ttsVideo.classList.add("hidden");
  isOtherQuestionVideo.classList.remove("hidden");
  isOtherQuestionVideo.muted = false;
  isOtherQuestionVideo.play();
  isOtherQuestionDialog.classList.remove("hidden");
}
document
  .getElementById("dialog")
  .addEventListener("click", userDontHaveMoreQuestionOkayPress);

function userDontHaveMoreQuestionOkayPress() {
  setTimeout(() => {
    isOtherQuestionVideo.classList.add("hidden");
    isOtherQuestionDialog.classList.add("hidden");
    wantToBeBahaiVideo.classList.remove("hidden");
    wantToBeBahaiDialog.classList.remove("hidden");
    ttsVideo.classList.add("hidden");
    wantToBeBahaiVideo.muted = false;
    wantToBeBahaiVideo.play();
    welcomeVideo.classList.add("hidden");
  }, [200]);
}
document
  .getElementById("bahaiYes")
  .addEventListener("click", handleBahaiYesClick);

async function handleBahaiYesClick() {
  try {
    const response = await fetch("/bahai-member", { method: "POST" });
    const data = await response.json();

    // Update Bahai member count
    document.getElementById("bahai-members").textContent = data.bahaiMembers;
  } catch (error) {
    console.error("Error updating Bahai member count:", error);
  }

  // fetch("join.php")
  //   .then((response) => response.text())
  //   .then((count) => {
  //     bahaiCountElement.textContent = count;
  //   });
  // Increment the counter via a POST request
  fetch("/increment", {
    method: "POST",
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Click count incremented to:", data.count);
      // Once the counter is incremented, redirect to the external URL
      window.location.href =
        "https://radiantcenturyproductions.com/become-a-bahai/";
    })
    .catch((error) => {
      console.error("Error incrementing the counter:", error);
      // Optionally handle the error case before redirecting, if desired
      window.location.href =
        "https://radiantcenturyproductions.com/become-a-bahai/";
    });
}
document
  .getElementById("bahaiNo")
  .addEventListener("click", handleBahaiNoClick);
function handleBahaiNoClick() {
  wantToBeBahaiDialog.classList.add("hidden");
  welcomeVideo.classList.add("hidden");
  welcomeDialog.classList.add("hidden");
  wantToBeBahaiVideo.classList.add("hidden");
  thankYouBahai.classList.remove("hidden");
  const promptElem = document.createElement("p");
  promptElem.className = "bot";
  promptElem.textContent = "Thank you for your interest in Baha'i faith";
  chatLog.scrollTop = chatLog.scrollHeight;
  chatLog.appendChild(promptElem);
  thankYouBahai.muted = false;
  thankYouBahai.play();
  chatLog.scrollTop = chatLog.scrollHeight;
}

/*


// const joinButton = document.getElementById("joinButton");
const visitorCountElement = document.getElementById("visitorCount");
const bahaiCountElement = document.getElementById("bahaiCount");

// Initial fetch for both counters
fetch("visitor_count.php")
  .then((response) => response.text())
  .then((count) => {
    visitorCountElement.textContent = count;
  });

fetch("bahai_count.php")
  .then((response) => response.text())
  .then((count) => {
    bahaiCountElement.textContent = count;
  });

// joinButton.addEventListener("click", () => {
//   fetch("join.php")
//     .then((response) => response.text())
//     .then((count) => {
//       bahaiCountElement.textContent = count;
//     });
// });



fetch("/website-visit")
  .then((response) => response.json())
  .then((data) => {
    document.getElementById(
      "visitorCounter"
    ).innerText = `Website Visits: ${data.websiteVisits}`;
    document.getElementById(
      "bahaiCounter"
    ).innerText = `Bahai Members: ${data.bahaiMembers}`;
  })
  .catch((error) => console.error("Error fetching counters:", error));

*/

// Fetch and display counters on page load

async function fetchCounters() {
  try {
    const response = await fetch("/api/website-visit");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON, got: ${text}`);
    }

    const data = await response.json();

    const visitorCounterElem = document.getElementById("visitorCounter");
    const uniqueVisitorsElem = document.getElementById("unique-visitors");
    const bahaiCounterElem = document.getElementById("bahaiCounter");

    if (visitorCounterElem) {
      visitorCounterElem.textContent = data.websiteVisits || '0';
    }

    if (uniqueVisitorsElem) {
      uniqueVisitorsElem.textContent = data.uniqueVisitors || '0';
    }

    if (bahaiCounterElem) {
      bahaiCounterElem.textContent = data.bahaiMembers || '0';
    }
  } catch (error) {
    console.error("Detailed error fetching counters:", error);

    const visitorCounterElem = document.getElementById("visitorCounter");
    const uniqueVisitorsElem = document.getElementById("unique-visitors");
    const bahaiCounterElem = document.getElementById("bahaiCounter");

    if (visitorCounterElem) visitorCounterElem.textContent = 'Error';
    if (uniqueVisitorsElem) uniqueVisitorsElem.textContent = 'Error';
    if (bahaiCounterElem) bahaiCounterElem.textContent = 'Error';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchCounters();
});