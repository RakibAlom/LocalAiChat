// Assumes baseEntries is loaded from keyworddb.js
const thresholds = [1, 0.98, 0.95, 0.92, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55];

// Cache for chat box, input, and button elements
const chatBox = document.getElementById('chatBox');
const input = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const stopBtn = document.getElementById('stopBtn');
let typingInterval;

// Clear chat history
function clearChat() {
  localStorage.removeItem('chat');
  chatBox.innerHTML = '';
}

// Save messages to local storage
function saveToLocal(message, sender) {
  const chat = JSON.parse(localStorage.getItem('chat')) || [];
  chat.push({ sender, message });
  localStorage.setItem('chat', JSON.stringify(chat));
}

// Load chat history from local storage
function loadChat() {
  const chat = JSON.parse(localStorage.getItem('chat')) || [];
  chatBox.innerHTML = '';
  chat.forEach(({ sender, message }) => addMessage(message, sender, false));
}

// Add a message to the chat
function addMessage(message, sender, save = true) {
  const messageEl = document.createElement('div');
  messageEl.className = sender === 'user' ? 'text-right' : 'text-left';
  messageEl.innerHTML = `<div class='inline-block p-2 px-4 rounded-2xl ${sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}'>${message}</div>`;
  chatBox.appendChild(messageEl);
  chatBox.scrollTop = chatBox.scrollHeight;
  if (save) saveToLocal(message, sender);
}

// Handle user input submission
function handleSubmit() {
  const userText = input.value.trim();
  if (!userText) return;
  input.value = '';
  addMessage(userText, 'user');
  const response = generateSmartResponse(userText);
  simulateTyping(response);
}

// Simulate typing effect for the bot response
function simulateTyping(text) {
  const typingEl = document.createElement('div');
  typingEl.className = 'text-left';
  const bubble = document.createElement('div');
  bubble.className = 'inline-block p-2 px-4 rounded-2xl bg-gray-200 text-black';
  const span = document.createElement('span');
  bubble.appendChild(span);
  typingEl.appendChild(bubble);
  chatBox.appendChild(typingEl);
  chatBox.scrollTop = chatBox.scrollHeight;

  let i = 0;
  sendBtn.classList.add('hidden');
  stopBtn.classList.remove('hidden');

  typingInterval = setInterval(() => {
    if (i < text.length) {
      span.textContent += text[i++];
      chatBox.scrollTop = chatBox.scrollHeight;
    } else {
      clearInterval(typingInterval);
      sendBtn.classList.remove('hidden');
      stopBtn.classList.add('hidden');
      saveToLocal(text, 'bot');
    }
  }, 30);
}

// Stop typing effect (if needed)
function stopTyping() {
  clearInterval(typingInterval);
  sendBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
}

// Generate a smart response based on user input
function generateSmartResponse(inputText) {
  const cleanedInput = inputText.toLowerCase().replace(/[^a-z0-9\s]/gi, '');
  const inputWords = cleanedInput.split(/\s+/);

  let bestMatch = null;
  let bestScore = 0;
  let bestLength = 0;

  // Loop through the thresholds to find the best match
  for (const threshold of thresholds) {
    for (const entry of baseEntries) {
      const keyWords = entry.keyword.toLowerCase().split(/\s+/); // Split keywords into words
      const allWords = new Set([...inputWords, ...keyWords]); // Combine input and keyword words
      const matchWords = keyWords.filter(word => inputWords.includes(word)); // Find matching words
      const score = matchWords.length / allWords.size; // Calculate match score

      if (score >= threshold) {
        // Check if this match is better than the previous best match
        if (score > bestScore || (score === bestScore && keyWords.length > bestLength)) {
          bestMatch = entry.answer;
          bestScore = score;
          bestLength = keyWords.length;
        }
      }
    }

    if (bestMatch) break; // Exit the loop once the best match is found at this threshold
  }

  // Return the best match response or a default message if no match is found
  return bestMatch || "Sorry, I don't have an answer for that yet. Feel free to ask me something else!";
}

// Load the chat history when the page is loaded
loadChat();
