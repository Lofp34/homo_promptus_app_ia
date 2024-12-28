// Configuration OpenAI
const OPENAI_API_KEY = "YOUR-API-KEY";
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
  
  // Suppression des boutons "Exploiter ce cas" existants
  const existingButtons = dailyUsageCard.querySelectorAll('.exploit-button');
  existingButtons.forEach(button => button.remove());
  
  // Ajout d'un nouveau bouton
  const exploitButton = document.createElement('button');
  exploitButton.className = 'small-button exploit-button';
  exploitButton.textContent = 'Exploiter ce cas';
  exploitButton.onclick = () => exploitDailyUsage(dailySuggestions[randomIndex]);
  dailyUsageCard.appendChild(exploitButton);
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

  // Application du format Markdown au prompt et à la réponse
  const promptElement = document.getElementById('promptOutput');
  promptElement.innerHTML = marked.parse(generatedPrompt);
  
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
    date: new Date().toLocaleString(),
    favorite: false
  };
  historyData.push(newEntry);

  localStorage.setItem('usageHistory', JSON.stringify(historyData));

  alert("Cas d'usage enregistré !");
  document.getElementById('userProblem').value = "";
  document.getElementById('usageResult').style.display = 'none';
  showSection('dashboard');
}

async function generateShortTitle(prompt, response) {
  const titlePrompt = `Génère un titre court et explicite (maximum 6 mots) qui résume ce cas d'usage. Prompt: "${prompt}", Réponse: "${response}"`;
  return await callGPT4o(titlePrompt);
}

async function showSectionHistorique() {
  const container = document.getElementById('usageHistory');
  container.innerHTML = "";

  let historyData = JSON.parse(localStorage.getItem('usageHistory')) || [];
  if (historyData.length === 0) {
    container.innerHTML = "<p>Aucun cas d'usage enregistré.</p>";
    return;
  }

  // Mise à jour des titres si nécessaire
  for (let entry of historyData) {
    if (!entry.shortTitle) {
      entry.shortTitle = await generateShortTitle(entry.prompt, entry.response);
    }
    if (entry.favorite === undefined) {
      entry.favorite = false;
    }
  }
  localStorage.setItem('usageHistory', JSON.stringify(historyData));

  historyData.forEach((entry, index) => {
    const div = document.createElement('div');
    div.className = 'card';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'card-header';
    headerDiv.style.display = 'flex';
    headerDiv.style.alignItems = 'center';
    headerDiv.style.gap = '10px';
    headerDiv.style.marginBottom = '10px';
    
    // Étoile favori
    const star = document.createElement('span');
    star.innerHTML = '⭐';
    star.style.cursor = 'pointer';
    star.style.opacity = entry.favorite ? '1' : '0.3';
    star.onclick = () => {
      entry.favorite = !entry.favorite;
      star.style.opacity = entry.favorite ? '1' : '0.3';
      localStorage.setItem('usageHistory', JSON.stringify(historyData));
    };
    
    // Titre et boutons
    const titleSpan = document.createElement('span');
    titleSpan.textContent = entry.shortTitle;
    titleSpan.style.flex = '1';
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'small-button';
    deleteButton.textContent = '🗑️';
    deleteButton.onclick = () => {
      if (confirm("Êtes-vous sûr de vouloir supprimer ce cas d'usage ?")) {
        historyData.splice(index, 1);
        localStorage.setItem('usageHistory', JSON.stringify(historyData));
        showSectionHistorique();
      }
    };
    
    const toggleButton = document.createElement('button');
    toggleButton.className = 'small-button';
    toggleButton.textContent = '▼';
    
    headerDiv.appendChild(star);
    headerDiv.appendChild(titleSpan);
    headerDiv.appendChild(deleteButton);
    headerDiv.appendChild(toggleButton);
    
    // Contenu détaillé
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = `
      <p><strong>Date :</strong> ${entry.date}</p>
      <p><strong>Prompt :</strong></p>
      <div class="markdown-content">${marked.parse(entry.prompt)}</div>
      <p><strong>Réponse :</strong></p>
      <div class="markdown-content">${marked.parse(entry.response)}</div>
      <p><strong>Feedback :</strong> ${entry.feedback}</p>
    `;
    contentDiv.style.display = 'none';
    
    toggleButton.onclick = () => {
      const isVisible = contentDiv.style.display === 'block';
      contentDiv.style.display = isVisible ? 'none' : 'block';
      toggleButton.textContent = isVisible ? '▼' : '▲';
    };
    
    div.appendChild(headerDiv);
    div.appendChild(contentDiv);
    container.appendChild(div);
  });
}

function clearHistory() {
  if (confirm("Êtes-vous sûr de vouloir vider l'historique ? Cette action est irréversible.")) {
    localStorage.removeItem('usageHistory');
    showSectionHistorique();
  }
}

// Fonction pour gérer l'indicateur de chargement
function toggleLoader(show) {
  const loader = document.getElementById('api-loader');
  if (!loader) {
    const loaderHTML = document.createElement('div');
    loaderHTML.id = 'api-loader';
    loaderHTML.className = 'api-loader hidden';
    loaderHTML.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loaderHTML);
  }
  document.getElementById('api-loader').classList.toggle('hidden', !show);
}

async function callGPT4o(userPrompt) {
  toggleLoader(true); // Afficher le loader
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
  } finally {
    toggleLoader(false); // Masquer le loader
  }
}

// Ajout des styles CSS pour l'animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .api-loader {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    background: rgba(255, 255, 255, 0.9);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .api-loader.hidden {
    display: none;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .markdown-content {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    margin: 10px 0;
  }
`;
document.head.appendChild(styleSheet);

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
