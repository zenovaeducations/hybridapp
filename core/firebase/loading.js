// Zenova Admin — Global Loading System

let loadingElement = null;

export function createLoadingScreen() {
  if (loadingElement) return loadingElement;

  const screen = document.createElement("div");

  screen.id = "zenovaLoadingScreen";

  screen.innerHTML = `
    <div class="zenova-loading-content">
      <div class="zenova-loading-ring">
        <div class="zenova-loading-z">Z</div>
      </div>

      <div class="zenova-loading-name">
        ZENOVA
      </div>
    </div>
  `;

  screen.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    opacity: 1;
    visibility: visible;
    transition: opacity 0.25s ease, visibility 0.25s ease;
  `;

  const style = document.createElement("style");

  style.textContent = `
    .zenova-loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      font-family: Arial, Helvetica, sans-serif;
    }

    .zenova-loading-ring {
      width: 58px;
      height: 58px;
      border: 2px solid #eeeeee;
      border-top-color: #6c4df6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: zenovaLoadingSpin 0.9s linear infinite;
    }

    .zenova-loading-z {
      font-size: 21px;
      font-weight: 700;
      color: #6c4df6;
      animation: zenovaLoadingCounterSpin 0.9s linear infinite;
    }

    .zenova-loading-name {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2.8px;
      color: #111111;
    }

    @keyframes zenovaLoadingSpin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes zenovaLoadingCounterSpin {
      to {
        transform: rotate(-360deg);
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(screen);

  loadingElement = screen;

  return screen;
}

export function showLoading() {
  const screen = createLoadingScreen();

  screen.style.opacity = "1";
  screen.style.visibility = "visible";
  screen.style.pointerEvents = "auto";
}

export function hideLoading() {
  const screen = loadingElement || createLoadingScreen();

  screen.style.opacity = "0";
  screen.style.visibility = "hidden";
  screen.style.pointerEvents = "none";
}

export function removeLoading() {
  if (!loadingElement) return;

  loadingElement.remove();
  loadingElement = null;
}
