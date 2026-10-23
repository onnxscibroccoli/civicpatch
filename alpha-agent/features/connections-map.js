"use strict";
window.CivicLab.register("connections-map", "Accessible dependency map", function (root, context) {
  /* ALPHA GENERATED START */
const outlineContainer = document.createElement('div'); outlineContainer.classList.add('outline-container'); const titleElement = document.createElement('h2'); titleElement.textContent = 'Internal Connections to Responsible Next Steps'; outlineContainer.appendChild(titleElement); const paragraph1 = document.createElement('p'); paragraph1.textContent = 'To turn a local civic concern into responsible next steps, you need to understand the internal connections between different systems and processes. This interactive outline will help you identify these connections clearly.'; outlineContainer.appendChild(paragraph1); const paragraph2 = document.createElement('p'); paragraph2.textContent = 'First, you need to gather information about the problem or issue you are addressing. This can be done through surveys, interviews, or other methods.'; outlineContainer.appendChild(paragraph2); const paragraph3 = document.createElement('p'); paragraph3.textContent = 'Once you have gathered this information, you need to identify the stakeholders involved in the problem. This includes the government agencies, non-profit organizations, and individuals who are affected by the issue.'; outlineContainer.appendChild(paragraph3); const paragraph4 = document.createElement('p'); paragraph4.textContent = 'Next, you need to understand the current state of the system or process that is causing the problem. This can be done through data analysis, interviews, or other methods.'; outlineContainer.appendChild(paragraph4); const paragraph5 = document.createElement('p'); paragraph5.textContent = 'Once you have a clear understanding of the problem and stakeholders involved, you need to identify the potential solutions. This can be done through brainstorming sessions, surveys, or other methods.'; outlineContainer.appendChild(paragraph5); const paragraph6 = document.createElement('p'); paragraph6.textContent = 'Finally, you need to implement the solution in a way that is sustainable and scalable. This can be done through pilot projects, user testing, and ongoing monitoring and evaluation.'; outlineContainer.appendChild(paragraph6); root.appendChild(outlineContainer);


const verifyButton = document.createElement("button");
verifyButton.type = "button";
verifyButton.textContent = "Show verification and next-step cautions";
verifyButton.setAttribute("aria-expanded", "false");
const verificationNote = document.createElement("p");
verificationNote.hidden = true;
verificationNote.textContent = "These connections are illustrative and unverified. Confirm the responsible agency, current official source, and accessibility of any process before acting.";
verifyButton.addEventListener("click", function () {
  verificationNote.hidden = !verificationNote.hidden;
  verifyButton.setAttribute("aria-expanded", String(!verificationNote.hidden));
});
root.appendChild(verifyButton);
root.appendChild(verificationNote);
const outlineContainer = document.createElement('div'); outlineContainer.classList.add('outline-container'); const titleElement = document.createElement('h2'); titleElement.textContent = 'Internal Connections to Responsible Next Steps'; outlineContainer.appendChild(titleElement); const paragraph1 = document.createElement('p'); paragraph1.textContent = 'To turn a local civic concern into responsible next steps, you need to understand the internal connections between different systems and processes. This involves identifying the key stakeholders involved in the issue, analyzing the current state of the system, and determining the necessary actions to address the problem. Once you have identified these connections, you can create a plan for implementing the changes required to make the system more effective and sustainable.'; const button = document.createElement('button'); button.textContent = 'Learn More'; button.addEventListener('click', () => { const paragraph2 = document.createElement('p'); paragraph2.textContent = 'To learn more about how to turn a local civic concern into responsible next steps, you can visit our website or contact us for further information.'; outlineContainer.appendChild(paragraph1); outlineContainer.appendChild(paragraph2); }); root.appendChild(outlineContainer);
  /* ALPHA GENERATED END */
});
