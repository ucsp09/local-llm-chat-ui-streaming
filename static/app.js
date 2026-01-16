const app = {
    modelProvider: "OLLAMA",
    model: "phi3"
};

// Auto-scroll helper
function scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
}

async function chatInputFormSubmitEventHandler(event) {
    event.preventDefault();

    const chatInputTextElement = document.getElementById('chat-input-text');
    const chatInputSubmitButton = document.getElementById('chat-input-submit-button');
    const chatMessageContainer = document.getElementById('chat-message-container');

    let rawUserMessage = chatInputTextElement.value;
    let trimmedUserMessage = rawUserMessage.trim();
    if (!trimmedUserMessage) return;

    // Disable input and button while streaming
    chatInputTextElement.disabled = true;
    chatInputSubmitButton.disabled = true;

    // Display user message
    createUserMessageDivElement(trimmedUserMessage);

    // Create assistant message <pre> container
    const assistantPreElement = createAssistantMessageDivElement('');

    // Clear input box
    chatInputTextElement.value = '';

    // Stream assistant response
    await streamChat(trimmedUserMessage, assistantPreElement);

    // Re-enable input
    chatInputTextElement.disabled = false;
    chatInputSubmitButton.disabled = false;
    chatInputTextElement.focus();

    // Auto-scroll chat container
    scrollToBottom(chatMessageContainer);
}

async function streamChat(userMessage, assistantPreElement) {
    const chatContainer = document.getElementById('chat-message-container');

    try {
        const response = await fetch('/api/v1/chat', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: app.model,
                modelProvider: app.modelProvider,
                message: userMessage
            })
        });

        if (!response.ok) {
            console.error("Chat Completion API failed:", response.status);
            assistantPreElement.textContent = "Sorry, could not fetch the response. Please try again.";
            scrollToBottom(chatContainer);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop();

            const fragment = document.createDocumentFragment();

            for (const line of lines) {
                if (!line.trim()) continue;

                let data;
                try { 
                    data = JSON.parse(line); 
                } catch { 
                    data = { message: { content: line } }; // fallback
                }

                if (data.error) {
                    const errorSpan = document.createElement('span');
                    errorSpan.style.color = 'red';
                    errorSpan.textContent = "\n[Error: Could not complete response]";
                    fragment.appendChild(errorSpan);
                    assistantPreElement.appendChild(fragment);
                    scrollToBottom(chatContainer);
                    return;
                } else {
                    // Extract content safely
                    const text = data.message?.content ?? line;
                    fragment.appendChild(document.createTextNode(text));
                }
            }

            assistantPreElement.appendChild(fragment);
            scrollToBottom(chatContainer);
        }

        if (buffer.trim()) {
            let data;
            try { 
                data = JSON.parse(buffer); 
            } catch { 
                data = { message: { content: buffer } }; 
            }

            const node = data.error
                ? (() => {
                    const span = document.createElement('span');
                    span.style.color = 'red';
                    span.textContent = "\n[Error: Could not complete response]";
                    return span;
                })()
                : document.createTextNode(data.message?.content ?? buffer);

            assistantPreElement.appendChild(node);
            scrollToBottom(chatContainer);
        }

    } catch (err) {
        console.error("Unexpected error during streaming:", err);
        const errorSpan = document.createElement('span');
        errorSpan.style.color = 'red';
        errorSpan.textContent = "\n[Error: Failed to fetch response]";
        assistantPreElement.appendChild(errorSpan);
        scrollToBottom(chatContainer);
    }
}


function clearChatWindow() {
    const chatMessageContainerElement = document.getElementById('chat-message-container');
    chatMessageContainerElement.replaceChildren();
}

function createUserMessageDivElement(userMessage) {
    const chatMessageContainerElement = document.getElementById('chat-message-container');
    const userMessageDivElement = document.createElement('div');
    userMessageDivElement.className = 'user-message';
    const preElement = document.createElement('pre');
    preElement.textContent = userMessage;
    userMessageDivElement.appendChild(preElement);
    chatMessageContainerElement.appendChild(userMessageDivElement);
    scrollToBottom(chatMessageContainerElement);
}

function createAssistantMessageDivElement(assistantMessage) {
    const chatMessageContainerElement = document.getElementById('chat-message-container');
    const assistantMessageDivElement = document.createElement('div');
    assistantMessageDivElement.className = 'assistant-message';
    const preElement = document.createElement('pre');
    preElement.textContent = assistantMessage;
    assistantMessageDivElement.appendChild(preElement);
    chatMessageContainerElement.appendChild(assistantMessageDivElement);
    scrollToBottom(chatMessageContainerElement);
    return preElement;
}

function autoExpandTextarea(textarea, maxHeight = 200) {
    textarea.style.height = 'auto'; // reset height
    let newHeight = textarea.scrollHeight;

    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        textarea.style.overflowY = 'auto'; // allow scroll
    } else {
        textarea.style.overflowY = 'hidden'; // hide scroll
    }

    textarea.style.height = newHeight + 'px';
}

function startApp() {
    const chatInputFormElement = document.getElementById('chat-input-form');
    const chatInputTextElement = document.getElementById('chat-input-text');

    chatInputFormElement.addEventListener('submit', chatInputFormSubmitEventHandler);

    // Auto-expand as user types
    chatInputTextElement.addEventListener('input', () => autoExpandTextarea(chatInputTextElement, 200));

    clearChatWindow();
}

startApp();
