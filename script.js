/**
 * ThinkMate
 * Copyright 2024
 * SPDX-License-Identifier: Apache-2.0
 */

import { marked } from "https://cdn.jsdelivr.net/npm/marked@13.0.3/lib/marked.esm.js";
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.es.mjs";

(async () => {
  const errorMessage = document.getElementById("error-message");
  const outputText = document.getElementById("outputText");
  const inputText = document.getElementById("inputText");
  const genreSelect = document.getElementById("genre");
  const styleSelect = document.getElementById("style");
  const languageSelect = document.getElementById("language");
  const sessionTemperature = document.getElementById("session-temperature");
  const sessionTopK = document.getElementById("session-top-k");
  const temperatureStat = document.getElementById("temperature-stat");
  const topKStat = document.getElementById("top-k-stat");
  const tokensSoFar = document.getElementById("tokens-so-far");
  const tokensLeft = document.getElementById("tokens-left");
  const maxTokens = document.getElementById("max-tokens");

  let session = null;

  // Check if Prompt API is available
  if (!self.ai || !self.ai.languageModel) {
    errorMessage.style.display = "block";
    errorMessage.innerHTML = `Your browser doesn't support the Prompt API. If you're on Chrome, join the <a href="https://developer.chrome.com/docs/ai/built-in#get_an_early_preview">Early Preview Program</a> to enable it.`;
    return;
  }

  const resetUI = () => {
    outputText.textContent = "Your generated content will appear here...";
    tokensSoFar.textContent = "";
    tokensLeft.textContent = "";
    maxTokens.textContent = "";
    temperatureStat.textContent = "";
    topKStat.textContent = "";
    inputText.focus();
  };

  const updateStats = () => {
    if (!session) return;
    const { maxTokens, temperature, tokensLeft, tokensSoFar, topK } = session;
    maxTokens.textContent = new Intl.NumberFormat("en-US").format(maxTokens);
    temperatureStat.textContent = temperature.toFixed(2);
    topKStat.textContent = topK;
    tokensLeft.textContent = tokensLeft;
    tokensSoFar.textContent = tokensSoFar;
  };

  const initializeSession = async () => {
    session = await self.ai.languageModel.create({
      temperature: parseFloat(sessionTemperature.value),
      topK: parseInt(sessionTopK.value, 10)
    });
    resetUI();
    updateStats();
  };

  const generateResponse = async (task) => {
    if (!inputText.value.trim()) return;

    const promptText = {
      summary: `Summarize this text in the ${genreSelect.value} genre: ${inputText.value}`,
      rewrite: `Rewrite this text in a ${styleSelect.value} style: ${inputText.value}`,
      counterArgument: `Generate a counter-argument for: ${inputText.value}`
    }[task];

    try {
      if (!session) await initializeSession();

      const stream = await session.promptStreaming(promptText);
      let fullResponse = "";
      for await (const chunk of stream) {
        fullResponse += chunk;
        outputText.innerHTML = DOMPurify.sanitize(marked.parse(fullResponse));
      }
    } catch (error) {
      outputText.textContent = `Error: ${error.message}`;
    } finally {
      updateStats();
    }
  };

  // Event listeners for different tasks
  document.getElementById("generate-summary").addEventListener("click", () => generateResponse("summary"));
  document.getElementById("generate-rewrite").addEventListener("click", () => generateResponse("rewrite"));
  document.getElementById("generate-counter").addEventListener("click", () => generateResponse("counterArgument"));

  sessionTemperature.addEventListener("input", async () => {
    await initializeSession();
  });

  sessionTopK.addEventListener("input", async () => {
    await initializeSession();
  });

  // Initialize the session with default values from capabilities
  if (!session) {
    const { defaultTopK, maxTopK, defaultTemperature } = await self.ai.languageModel.capabilities();
    sessionTemperature.value = defaultTemperature;
    sessionTopK.value = defaultTopK;
    sessionTopK.max = maxTopK;
    await initializeSession();
  }
})();
