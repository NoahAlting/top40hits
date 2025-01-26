function createInfoButtonWithTooltip(
  containerId,
  plotTitle,
  whatAreYouLookingAt,
  xAxis,
  yAxis,
  marks,
  whatCanYouDo,
  left_right
) {
  const infoButton = document.createElement("button");
  infoButton.id = "information_button";
  infoButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <circle cx="12" cy="12" r="10" fill="#007bff"></circle> <!-- Adjusted cy to 13 for more space -->
            <line x1="12" y1="18" x2="12" y2="10" stroke="white" stroke-width="2"></line> <!-- No need to move line if circle is moved -->
            <circle cx="12" cy="7" r="1.5" fill="white"></circle>
        </svg>`;
  infoButton.style.border = "none";
  infoButton.style.background = "none";
  infoButton.style.cursor = "pointer";
  infoButton.style.position = "absolute";
  infoButton.style.top = "10px";
  if (left_right == "right") {
    infoButton.style.right = "10px";
  }
  if (left_right == "left") {
    infoButton.style.left = "10px";
  }
  infoButton.style.zIndex = "10";

  const tooltip = document.createElement("div");
  tooltip.id = "information_button_content";
  tooltip.style.position = "absolute";
  tooltip.style.top = "40px";
  tooltip.style.right = "10px";
  tooltip.style.padding = "10px";
  tooltip.style.background = "rgba(0, 0, 0, 0.8)";
  tooltip.style.color = "white";
  tooltip.style.borderRadius = "8px";
  tooltip.style.fontSize = "14px";
  tooltip.style.maxWidth = "500px";
  tooltip.style.display = "none";
  tooltip.style.zIndex = "11";

  function createTooltipLine(title, text) {
    const line = document.createElement("div");
    line.style.display = "flex";
    line.style.justifyContent = "flex-start";
    line.style.marginBottom = "5px";

    const titleElement = document.createElement("strong");
    titleElement.textContent = title;
    titleElement.style.flex = "1";
    titleElement.style.textAlign = "left";

    const textElement = document.createElement("span");
    textElement.textContent = text;
    textElement.style.flex = "2";
    textElement.style.textAlign = "left";

    line.appendChild(titleElement);
    line.appendChild(textElement);

    return line;
  }

  tooltip.appendChild(createTooltipLine("Plot title:", plotTitle));
  tooltip.appendChild(
    createTooltipLine("What are you looking at:", whatAreYouLookingAt)
  );
  tooltip.appendChild(createTooltipLine("X-axis:", xAxis));
  tooltip.appendChild(createTooltipLine("Y-axis:", yAxis));
  tooltip.appendChild(createTooltipLine("Marks:", marks));
  tooltip.appendChild(
    createTooltipLine("What can you do with it:", whatCanYouDo)
  );

  infoButton.addEventListener("click", (event) => {
    event.stopPropagation();
    tooltip.style.display = tooltip.style.display === "none" ? "block" : "none";
  });

  document.addEventListener("click", (event) => {
    if (!infoButton.contains(event.target) && !tooltip.contains(event.target)) {
      tooltip.style.display = "none";
    }
  });

  const container = document.getElementById(containerId);
  container.style.position = "relative";
  container.appendChild(infoButton);
  container.appendChild(tooltip);
}

function removeButtonByContainerId(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      const button = container.querySelector("#information_button");  // Updated selector
      const tooltip = container.querySelector("#information_button_content");  // Updated selector
      if (button) button.remove();
      if (tooltip) tooltip.remove();
    }
  }
  
