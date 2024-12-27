// Configuration OpenAI
const OPENAI_API_KEY = "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";
const API_URL = "https://api.openai.com/v1/chat/completions";

// Variables globales
let userProfile = {
  role: '',
  defi: '',
  attente: ''
};

const dailySuggestions = [
  "Exploitez l'IA pour rédiger un premier jet de message de prospection LinkedIn.",
  "Lancez votre séquence d'emails automatiques pour la relance client.",
  "Utilisez l'IA pour résumer rapidement vos rendez-vous de la semaine.",
  "Générez un pitch personnalisé pour un prospect clé.",
  "Déléguez la recherche d'arguments de vente adaptés à votre produit."
];

// Fonctions principales
function showSection(sectionId) {
  const sections = ['onboarding', 'dashboard', 'creation', 'historique'];
  sections.forEach(s => {
    document.getElementById(s).classList.add('hidden');
  });
  document.getElementById(sectionId).classList.remove('hidden');
  
  if(sectionId === 'historique') {
    showSectionHistorique();
  }
}

function completeOnboarding() {
  userProfile.role = document.getElementById('role').value;
  userProfile.defi = document.getElementById('defi').value;
  userProfile.attente = document.getElementById('attente').value;

  localStorage.setItem('userProfile', JSON.stringify(userProfile));
  updateGreeting();
  showSection('dashboard');
}

async function updateGreeting() {
  let storedProfile = localStorage.getItem('userProfile');
  if (storedProfile) {
    userProfile = JSON.parse(storedProfile);
  }
  
  const greetingPrompt = `Génère un message d'accueil personnalisé et encourageant en maximum 40 mots pour un ${userProfile.role} dont le défi principal est "${userProfile.defi}". Le message doit être naturel et motivant.`;
  
  try {
    const greeting = await callGPT4o(greetingPrompt);
    document.getElementById('greeting').textContent = greeting;
  } catch (error) {
    document.getElementById('greeting').textContent = `Bonjour ${userProfile.role || 'vous'}, prêt à conquérir votre défi : "${userProfile.defi}" ?`;
  }
  
  getRandomDailyUsage();
}

function getRandomDailyUsage() {
  const randomIndex = Math.floor(Math.random() * dailySuggestions.length);
  const dailyUsageCard = document.getElementById('dailyUsageText').parentElement;
  
  // Mise à jour du contenu de la carte
  document.getElementById('dailyUsageText').textContent = dailySuggestions[randomIndex];
  
  // Ajout du bouton d'exploitation s'il n'existe pas déjà
  if (!dailyUsageCard.querySelector('.exploit-button')) {
    const exploitButton = document.createElement('button');
    exploitButton.className = 'small-button';
    exploitButton.textContent = 'Exploiter ce cas';
    exploitButton.onclick = () => exploitDailyUsage(dailySuggestions[randomIndex]);
    dailyUsageCard.appendChild(exploitButton);
  }
}

async function exploitDailyUsage(usage) {
  document.getElementById('userProblem').value = usage;
  showSection('creation');
  await generateUsage();
}

async function generateUsage() {
  const problem = document.getElementById('userProblem').value.trim();
  if (!problem) {
    alert("Veuillez décrire rapidement votre besoin ou problème.");
    return;
  }

  // Génération d'un prompt intelligent basé sur le contexte
  const promptForPrompt = `En tant qu'expert en IA, génère un prompt professionnel et précis pour aider un ${userProfile.role} avec le problème suivant : "${problem}". Le prompt doit être orienté solution et spécifique au contexte professionnel.`;
  
  const generatedPrompt = await callGPT4o(promptForPrompt);
  const response = await callGPT4o(generatedPrompt + "\n\nRéponds de manière concise (max 100 mots) et utilise le markdown pour structurer ta réponse.");

  document.getElementById('promptOutput').textContent = generatedPrompt;
  // Utilisation d'une bibliothèque Markdown
  const responseElement = document.getElementById('responseOutput');
  responseElement.innerHTML = marked.parse(response);
  document.getElementById('usageResult').style.display = 'block';
}

function saveUsage(feedback) {
  let promptText = document.getElementById('promptOutput').textContent;
  let responseText = document.getElementById('responseOutput').textContent;

  let historyData = JSON.parse(localStorage.getItem('usageHistory')) || [];

  let newEntry = {
    prompt: promptText,
    response: responseText,
    feedback: feedback,
    date: new Date().toLocaleString()
  };
  historyData.push(newEntry);

  localStorage.setItem('usageHistory', JSON.stringify(historyData));

  alert("Cas d'usage enregistré !");
  document.getElementById('userProblem').value = "";
  document.getElementById('usageResult').style.display = 'none';
  showSection('dashboard');
}

function showSectionHistorique() {
  const container = document.getElementById('usageHistory');
  container.innerHTML = "";

  let historyData = JSON.parse(localStorage.getItem('usageHistory')) || [];
  if (historyData.length === 0) {
    container.innerHTML = "<p>Aucun cas d'usage enregistré.</p>";
    return;
  }

  historyData.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <p><strong>Date :</strong> ${entry.date}</p>
      <p><strong>Prompt :</strong> ${entry.prompt}</p>
      <p><strong>Réponse :</strong> ${entry.response}</p>
      <p><strong>Feedback :</strong> ${entry.feedback}</p>
    `;
    container.appendChild(div);
  });
}

function clearHistory() {
  if (confirm("Êtes-vous sûr de vouloir vider l'historique ? Cette action est irréversible.")) {
    localStorage.removeItem('usageHistory');
    showSectionHistorique();
  }
}

async function callGPT4o(userPrompt) {
  try {
    const requestBody = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Tu es un assistant utile et concis." },
        { role: "user",   content: userPrompt }
      ]
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (err) {
    console.error(err);
    return "Désolé, une erreur est survenue lors de l'appel à GPT-4o.";
  }
}

// Initialisation
window.onload = function() {
  const storedProfile = localStorage.getItem('userProfile');
  if(storedProfile) {
    userProfile = JSON.parse(storedProfile);
    showSection('dashboard');
    updateGreeting();
  } else {
    showSection('onboarding');
  }
} 