// Initialisation de UnicornStudio (Canvas 3D)
document.addEventListener("DOMContentLoaded", function() {
    if (window.UnicornStudio) {
        UnicornStudio.init();
    }
});

// Fonction pour afficher/masquer les détails d'un projet
function toggleProject(button, projectId) {
  const details = document.getElementById(projectId);

  if (details.style.display === "block") {
    details.style.display = "none";
    button.textContent = "Voir plus";
  } else {
    details.style.display = "block";
    button.textContent = "Voir moins";
  }
}

// Animation d'apparition au défilement (Scroll Reveal)
function revealOnScroll() {
    const reveals = document.querySelectorAll('.reveal');
    const windowHeight = window.innerHeight;
    const elementVisible = 100;

    reveals.forEach((reveal) => {
        const elementTop = reveal.getBoundingClientRect().top;
        if (elementTop < windowHeight - elementVisible) {
            reveal.classList.add('active');
        }
    });
}

window.addEventListener('scroll', revealOnScroll);
// Déclencher une fois au chargement pour les éléments déjà visibles
revealOnScroll();
