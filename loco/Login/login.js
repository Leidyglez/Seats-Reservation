document.addEventListener('DOMContentLoaded', () => {
    // Patrón de puntos optimizado
    const dotsContainer = document.getElementById('dots');
    const dotCount = Math.floor(window.innerWidth * window.innerHeight / 2500);
    
    for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = `${Math.random() * 100}%`;
        dot.style.top = `${Math.random() * 100}%`;
        dot.style.animationDelay = `${Math.random() * 2}s`;
        dotsContainer.appendChild(dot);
    }

    // Toggle password mejorado
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    const eyeIcon = togglePassword.querySelector('svg');
    
    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        eyeIcon.style.stroke = isPassword ? 'var(--primary)' : 'var(--gray)';
    });
});