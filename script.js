// --- Global Settings ---
const CANVAS_PADDING = 50;
const LABEL_OFFSET = 15;
const ANGLE_ARC_RADIUS = 20;
const ANGLE_LABEL_OFFSET = 25;
const epsilon = 0.01; // Tolerance for floating point comparisons

// --- NEW: Function to toggle visible input fields ---
function toggleInputMode() {
    const modoLAL = document.getElementById('modo_lal').checked;
    const inputsLAL = document.getElementById('inputs_lal');
    const inputsLLL = document.getElementById('inputs_lll');

    if (modoLAL) {
        inputsLAL.style.display = 'block';
        inputsLLL.style.display = 'none';
    } else { // modoLLL is checked
        inputsLAL.style.display = 'none';
        inputsLLL.style.display = 'block';
    }
    // Clear previous results and canvas when mode changes
    clearCanvasAndResults();
}

// --- Modified Main Drawing Function ---
function desenharTriangulo() {
    const modoLAL = document.getElementById('modo_lal').checked;
    let ladoA_input, ladoB_input, ladoC_input, anguloA_deg, anguloB_deg, anguloC_deg;

    // --- 1. Get Inputs and Validate Based on Mode ---
    if (modoLAL) {
        ladoA_input = parseFloat(document.getElementById('lado_a_lal').value);
        ladoB_input = parseFloat(document.getElementById('lado_b_lal').value);
        anguloC_deg = parseFloat(document.getElementById('angulo_C_lal').value); // Input angle IS angle C

        if (isNaN(ladoA_input) || isNaN(ladoB_input) || isNaN(anguloC_deg)) {
            alert('Modo LAL: Preencha todos os campos numéricos!');
            return;
        }
        if (ladoA_input <= 0 || ladoB_input <= 0) {
            alert('Modo LAL: Os comprimentos dos lados devem ser positivos!');
            return;
        }
        if (anguloC_deg <= 0 || anguloC_deg >= 180) {
            alert('Modo LAL: O ângulo deve ser maior que 0 e menor que 180 graus!');
            return;
        }

        // --- 2a. Calculate Missing Parts for LAL ---
        const anguloC_rad = anguloC_deg * Math.PI / 180;
        ladoC_input = Math.sqrt(ladoA_input**2 + ladoB_input**2 - 2 * ladoA_input * ladoB_input * Math.cos(anguloC_rad));

        // Calculate angle A using Law of Cosines (more robust than Law of Sines)
        let cosA = (ladoB_input**2 + ladoC_input**2 - ladoA_input**2) / (2 * ladoB_input * ladoC_input);
        cosA = Math.max(-1, Math.min(1, cosA)); // Clamp for safety
        anguloA_deg = Math.acos(cosA) * (180 / Math.PI);

        // Calculate angle B
        anguloB_deg = 180.0 - anguloA_deg - anguloC_deg;

    } else { // Mode LLL
        ladoA_input = parseFloat(document.getElementById('lado_a_lll').value);
        ladoB_input = parseFloat(document.getElementById('lado_b_lll').value);
        ladoC_input = parseFloat(document.getElementById('lado_c_lll').value);

        if (isNaN(ladoA_input) || isNaN(ladoB_input) || isNaN(ladoC_input)) {
            alert('Modo LLL: Preencha todos os campos numéricos!');
            return;
        }
        if (ladoA_input <= 0 || ladoB_input <= 0 || ladoC_input <= 0) {
            alert('Modo LLL: Os comprimentos dos lados devem ser positivos!');
            return;
        }

        // --- NEW: Triangle Inequality Validation for LLL ---
        if (ladoA_input + ladoB_input <= ladoC_input + epsilon ||
            ladoA_input + ladoC_input <= ladoB_input + epsilon ||
            ladoB_input + ladoC_input <= ladoA_input + epsilon) {
            alert('Erro: Estes lados não formam um triângulo válido (Desigualdade Triangular). A soma de dois lados deve ser maior que o terceiro.');
            clearCanvasAndResults(); // Clear if invalid
            return;
        }

        // --- 2b. Calculate Missing Parts for LLL (Angles) ---
        // Calculate angle A
        let cosA = (ladoB_input**2 + ladoC_input**2 - ladoA_input**2) / (2 * ladoB_input * ladoC_input);
        cosA = Math.max(-1, Math.min(1, cosA)); // Clamp
        anguloA_deg = Math.acos(cosA) * (180 / Math.PI);

        // Calculate angle B
        let cosB = (ladoA_input**2 + ladoC_input**2 - ladoB_input**2) / (2 * ladoA_input * ladoC_input);
        cosB = Math.max(-1, Math.min(1, cosB)); // Clamp
        anguloB_deg = Math.acos(cosB) * (180 / Math.PI);

        // Calculate angle C
        anguloC_deg = 180.0 - anguloA_deg - anguloB_deg;
    }

    // --- Sanity Check for Calculated Angles (Applies to both modes) ---
    if (Math.abs(anguloA_deg + anguloB_deg + anguloC_deg - 180.0) > epsilon * 10) { // Wider tolerance after calculations
         console.error("Erro de cálculo: Soma dos ângulos não é 180°", anguloA_deg, anguloB_deg, anguloC_deg);
         alert("Ocorreu um erro interno no cálculo dos ângulos. Verifique os valores de entrada.");
         // clearCanvasAndResults(); // Optionally clear
         return;
     }
     if (anguloA_deg <= 0 || anguloB_deg <= 0 || anguloC_deg <= 0) {
         console.error("Erro de cálculo: Ângulo inválido calculado", anguloA_deg, anguloB_deg, anguloC_deg);
         // This might happen with near-degenerate triangles in LLL or floating point issues
         alert("Não foi possível calcular ângulos válidos. Verifique os valores de entrada.");
         // clearCanvasAndResults(); // Optionally clear
         return;
     }


    // --- 3. Prepare Canvas and Context ---
    const canvas = document.getElementById('meuCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineJoin = 'round';

    // --- 4. Define Triangle Vertices (Using Sides a, b and Angle C for consistency) ---
    // Regardless of input mode, we now have a, b, c, A, B, C. We can use the LAL drawing logic.
    const anguloC_rad_draw = anguloC_deg * Math.PI / 180; // Use calculated/validated angle C
    const vertexC_initial = { x: 0, y: 0 };
    const vertexA_initial = { x: ladoB_input, y: 0 }; // Side b along x-axis
    const vertexB_initial = {
        x: ladoA_input * Math.cos(anguloC_rad_draw),
        y: -ladoA_input * Math.sin(anguloC_rad_draw) // Negative Y for canvas coords
    };


    // --- 5. Calculate Scaling and Translation (No changes needed here) ---
    const minX = Math.min(vertexA_initial.x, vertexB_initial.x, vertexC_initial.x);
    const maxX = Math.max(vertexA_initial.x, vertexB_initial.x, vertexC_initial.x);
    const minY = Math.min(vertexA_initial.y, vertexB_initial.y, vertexC_initial.y);
    const maxY = Math.max(vertexA_initial.y, vertexB_initial.y, vertexC_initial.y);
    const triangleWidth = maxX - minX;
    const triangleHeight = maxY - minY;
    const availableWidth = canvas.width - 2 * CANVAS_PADDING;
    const availableHeight = canvas.height - 2 * CANVAS_PADDING;
    const scaleX = triangleWidth === 0 ? 1 : availableWidth / triangleWidth;
    const scaleY = triangleHeight === 0 ? 1 : availableHeight / triangleHeight;
    const scale = Math.min(scaleX, scaleY);
    const scaledWidth = triangleWidth * scale;
    const scaledHeight = triangleHeight * scale;
    const translateX = (canvas.width - scaledWidth) / 2 - (minX * scale);
    const translateY = (canvas.height - scaledHeight) / 2 - (minY * scale);

    // --- 6. Calculate Final Screen Coordinates (No changes needed here) ---
    const vertexA = {
        x: vertexA_initial.x * scale + translateX,
        y: vertexA_initial.y * scale + translateY
    };
    const vertexB = {
        x: vertexB_initial.x * scale + translateX,
        y: vertexB_initial.y * scale + translateY
    };
    const vertexC = {
        x: vertexC_initial.x * scale + translateX,
        y: vertexC_initial.y * scale + translateY
    };


    // --- 7. Draw Triangle Sides (No changes needed here) ---
    ctx.beginPath();
    ctx.moveTo(vertexA.x, vertexA.y);
    ctx.lineTo(vertexB.x, vertexB.y);
    ctx.lineTo(vertexC.x, vertexC.y);
    ctx.closePath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- 8. Draw Side Labels (Using final values) ---
    ctx.fillStyle = '#337ab7';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawLabel(`a = ${ladoA_input.toFixed(2)} u`, vertexB, vertexC, ctx, LABEL_OFFSET);
    drawLabel(`b = ${ladoB_input.toFixed(2)} u`, vertexA, vertexC, ctx, LABEL_OFFSET);
    drawLabel(`c = ${ladoC_input.toFixed(2)} u`, vertexA, vertexB, ctx, LABEL_OFFSET);


    // --- 9. Draw Angle Arcs and Labels (Using final values) ---
    // Angle A (at Vertex A)
    drawAngleArc(ctx, vertexA, vertexC, vertexB, ANGLE_ARC_RADIUS, '#d9534f'); // Red
    drawAngleLabel(ctx, vertexA, vertexC, vertexB, ANGLE_LABEL_OFFSET, `${anguloA_deg.toFixed(1)}°`, '#d9534f');
    // Angle B (at Vertex B)
    drawAngleArc(ctx, vertexB, vertexA, vertexC, ANGLE_ARC_RADIUS, '#5cb85c'); // Green
    drawAngleLabel(ctx, vertexB, vertexA, vertexC, ANGLE_LABEL_OFFSET, `${anguloB_deg.toFixed(1)}°`, '#5cb85c');
    // Angle C (at Vertex C)
    drawAngleArc(ctx, vertexC, vertexB, vertexA, ANGLE_ARC_RADIUS, '#428bca'); // Blue
    drawAngleLabel(ctx, vertexC, vertexB, vertexA, ANGLE_LABEL_OFFSET, `${anguloC_deg.toFixed(1)}°`, '#428bca');


    // --- 10. Display Calculated Results ---
    mostrarResultados(ladoA_input, ladoB_input, ladoC_input, anguloA_deg, anguloB_deg, anguloC_deg);
}

// --- Helper Drawing Functions (drawLabel, drawAngleArc, drawAngleLabel) ---
// (No changes needed in these helper functions)
/** Draws a label near the midpoint of the segment connecting p1 and p2. */
function drawLabel(text, p1, p2, ctx, offset) {
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x); // Angle of the segment
    const labelAngle = angle + Math.PI / 2; // Perpendicular angle for offset

    const labelX = midX + offset * Math.cos(labelAngle);
    const labelY = midY + offset * Math.sin(labelAngle);
    ctx.fillText(text, labelX, labelY);
}

/** Draws an arc representing the angle at vertex P, between segments P->P1 and P->P2. */
function drawAngleArc(ctx, P, P1, P2, radius, color) {
    const angle1 = Math.atan2(P1.y - P.y, P1.x - P.x);
    const angle2 = Math.atan2(P2.y - P.y, P2.x - P.x);

    // Ensure drawing the smaller angle arc using angle difference check
    let startAngle = angle1;
    let endAngle = angle2;
    let diff = endAngle - startAngle;
    while (diff <= -Math.PI) { diff += 2 * Math.PI; } // Adjust difference to be in (-PI, PI] or similar range
    while (diff > Math.PI) { diff -= 2 * Math.PI; }

    // Decide direction based on the sign of the smallest angle difference
    let counterClockwise = diff < 0;

    ctx.beginPath();
    // Use the adjusted start/end or the original ones based on counterClockwise flag if needed
    // The standard arc method often handles this correctly if angles are consistent
    ctx.arc(P.x, P.y, radius, startAngle, endAngle, counterClockwise);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
}


/** Draws the angle value near the angle arc. */
function drawAngleLabel(ctx, P, P1, P2, offset, text, color) {
    const angle1 = Math.atan2(P1.y - P.y, P1.x - P.x);
    const angle2 = Math.atan2(P2.y - P.y, P2.x - P.x);

    let midAngle = (angle1 + angle2) / 2;
    // Correct the midAngle if the arc spans across the -PI/PI discontinuity
    if (Math.abs(angle1 - angle2) > Math.PI) {
        midAngle += Math.PI;
    }
     // Ensure text isn't placed exactly on a line if angle is ~180
     if (Math.abs(Math.abs(angle1 - angle2) - Math.PI) < epsilon) {
          midAngle += 0.1; // Add a small offset if angle is 180 deg
      }

    const labelX = P.x + offset * Math.cos(midAngle);
    const labelY = P.y + offset * Math.sin(midAngle);

    ctx.fillStyle = color;
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, labelX, labelY);
}


// --- Results and Utility Functions ---

/** Displays calculated area, perimeter, and triangle type. */
function mostrarResultados(a, b, c, angA, angB, angC) {
    // --- MODIFIED: Area calculation - use calculated angle C for consistency ---
    // Or use Heron's formula if LLL input was used and preferred:
    // const s = (a + b + c) / 2;
    // const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
    // Using SAS formula with calculated C is usually fine:
    const area = 0.5 * a * b * Math.sin(angC * Math.PI / 180);

    const perimetro = a + b + c;
    let tipoLado = '';
    let tipoAngulo = '';

    // Classify by sides
    if (Math.abs(a - b) < epsilon && Math.abs(b - c) < epsilon) {
        tipoLado = "Equilátero";
    } else if (Math.abs(a - b) < epsilon || Math.abs(b - c) < epsilon || Math.abs(a - c) < epsilon) {
        tipoLado = "Isósceles";
    } else {
        tipoLado = "Escaleno";
    }

    // Classify by angles
    const angles = [angA, angB, angC];
    if (angles.some(angle => Math.abs(angle - 90) < epsilon)) {
        tipoAngulo = "Retângulo";
    } else if (angles.some(angle => angle > 90 + epsilon)) { // Added epsilon for > 90 check
        tipoAngulo = "Obtusângulo";
    } else {
        tipoAngulo = "Acutângulo";
    }

    const tipo = `${tipoLado} ${tipoAngulo}`;

    // --- NEW: Add sum of angles check to results ---
    const sumAngles = angA + angB + angC;

    document.getElementById('resultado').innerHTML = `
    <b>Resultados:</b><br>
    Lado a: ${a.toFixed(2)} u<br>
    Lado b: ${b.toFixed(2)} u<br>
    Lado c: ${c.toFixed(2)} u<br>
    Ângulo A: ${angA.toFixed(1)}°<br>
    Ângulo B: ${angB.toFixed(1)}°<br>
    Ângulo C: ${angC.toFixed(1)}°<br>
    --------------------<br>
    Soma dos Ângulos: ${sumAngles.toFixed(1)}°<br> <!-- Added Sum -->
    Área: ${area.toFixed(2)} u²<br>
    Perímetro: ${perimetro.toFixed(2)} u<br>
    Tipo: ${tipo}<br>
  `;
}

/** Clears the canvas and results display */
function clearCanvasAndResults() {
     const canvas = document.getElementById('meuCanvas');
     if (canvas) { // Check if canvas exists
         const ctx = canvas.getContext('2d');
         ctx.clearRect(0, 0, canvas.width, canvas.height);
     }
     const resultadoDiv = document.getElementById('resultado');
     if (resultadoDiv) { // Check if results div exists
         resultadoDiv.innerHTML = `
            <b>Resultados:</b><br>
            Aguardando entrada...
         `;
     }
}


/** Downloads the current canvas drawing as a PNG image. */
// (No changes needed)
function baixarImagem() {
    const canvas = document.getElementById('meuCanvas');
    if (isCanvasBlank(canvas)) {
        alert("Desenhe um triângulo antes de baixar a imagem.");
        return;
    }
    const link = document.createElement('a');
    link.download = 'triangulo_calculado.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    link.remove();
}

/** Generates a PDF report with the drawing and results. */
// (No changes needed)
function gerarPDF() {
    const canvas = document.getElementById('meuCanvas');
     if (isCanvasBlank(canvas)) {
        alert("Desenhe um triângulo antes de gerar o PDF.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'pt',
        format: 'a4'
    });

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const margin = 40;
    const pdfWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
    const pdfHeight = pdf.internal.pageSize.getHeight() - 2 * margin;
    const imgScale = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
    const imgWidth = canvasWidth * imgScale;
    const imgHeight = canvasHeight * imgScale;

    pdf.setFontSize(18);
    pdf.text("Relatório do Triângulo Interativo", margin, margin);
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', margin, margin + 30, imgWidth, imgHeight);

    const textoResultados = document.getElementById('resultado').innerText;
    pdf.setFontSize(11);
    const textLines = pdf.splitTextToSize(textoResultados, pdfWidth);
    pdf.text(textLines, margin, margin + 30 + imgHeight + 25);

    pdf.save("relatorio_triangulo.pdf");
}

/** Checks if the canvas is effectively blank. */
// (No changes needed)
function isCanvasBlank(canvas) {
    const context = canvas.getContext('2d');
    // Optimization: Check a few pixels instead of the whole buffer for speed
    // For simplicity, keeping the original check
    try {
        const pixelBuffer = new Uint32Array(
            context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        );
         // A completely blank (cleared) canvas should have all pixels as 0 (transparent black)
        return !pixelBuffer.some(pixel => pixel !== 0);
     } catch (e) {
         console.error("Could not check canvas blank status:", e);
         return false; // Assume not blank if cannot check
     }
}

// --- Initialize Input Mode on Page Load ---
// Ensures the correct fields are shown when the page first loads
document.addEventListener('DOMContentLoaded', (event) => {
    toggleInputMode();
});