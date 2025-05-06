// --- Global Settings ---
const CANVAS_PADDING = 50; // Minimum space around the triangle
const LABEL_OFFSET = 15;   // Distance of side labels from lines
const ANGLE_ARC_RADIUS = 20; // Radius of angle arcs
const ANGLE_LABEL_OFFSET = 25; // Distance of angle labels from vertex

// --- Main Drawing Function ---
function desenharTriangulo() {
    // 1. Get and Validate Inputs (Standard SAS: side a, side b, angle C)
    const ladoA_input = parseFloat(document.getElementById('lado_a').value);
    const ladoB_input = parseFloat(document.getElementById('lado_b').value);
    const anguloC_input_deg = parseFloat(document.getElementById('angulo_C').value);

    if (isNaN(ladoA_input) || isNaN(ladoB_input) || isNaN(anguloC_input_deg)) {
        alert('Erro: Preencha todos os campos numéricos!');
        return;
    }
    if (ladoA_input <= 0 || ladoB_input <= 0) {
        alert('Erro: Os comprimentos dos lados devem ser positivos!');
        return;
    }
    if (anguloC_input_deg <= 0 || anguloC_input_deg >= 180) {
        alert('Erro: O ângulo deve ser maior que 0 e menor que 180 graus!');
        return;
    }

    // Convert input angle C to radians
    const anguloC_rad = anguloC_input_deg * Math.PI / 180;

    // 2. Calculate Missing Parts (Law of Cosines for side c, Law of Sines/Cosines for angles A, B)
    // Calculate side c (opposite angle C)
    const ladoC = Math.sqrt(ladoA_input**2 + ladoB_input**2 - 2 * ladoA_input * ladoB_input * Math.cos(anguloC_rad));

    // Calculate angle A (opposite side a) using Law of Cosines to avoid arcsin ambiguity
    let cosA = (ladoB_input**2 + ladoC**2 - ladoA_input**2) / (2 * ladoB_input * ladoC);
    // Clamp cosA value to [-1, 1] due to potential floating point inaccuracies
    cosA = Math.max(-1, Math.min(1, cosA));
    const anguloA_rad = Math.acos(cosA);
    const anguloA_deg = anguloA_rad * (180 / Math.PI);

    // Calculate angle B (opposite side b)
    // Can use Law of Sines or simply 180 - A - C
    const anguloB_deg = 180 - anguloA_deg - anguloC_input_deg;
    const anguloB_rad = anguloB_deg * Math.PI / 180;

    // Check if triangle is possible (sum of angles close to 180)
    if (Math.abs(anguloA_deg + anguloB_deg + anguloC_input_deg - 180) > 0.01) {
        alert("Erro: Não é possível formar um triângulo com esses valores (verifique a precisão ou validade).");
        // Optionally clear canvas and results
        // clearCanvasAndResults();
        return;
    }

    // 3. Prepare Canvas and Context
    const canvas = document.getElementById('meuCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineJoin = 'round'; // Nicer corners

    // 4. Define Triangle Vertices (Conceptual - before scaling/translation)
    // Place Vertex C at the origin (0,0) for initial calculation
    // Place Vertex A along the positive X-axis (side b)
    // Place Vertex B based on side a and angle C
    const vertexC_initial = { x: 0, y: 0 };
    const vertexA_initial = { x: ladoB_input, y: 0 }; // Side b length along x-axis
    const vertexB_initial = {
        x: ladoA_input * Math.cos(anguloC_rad),
        y: -ladoA_input * Math.sin(anguloC_rad) // Use negative Y because canvas Y increases downwards
    };

    // 5. Calculate Scaling and Translation for Centering
    // Find bounding box of the conceptual triangle
    const minX = Math.min(vertexA_initial.x, vertexB_initial.x, vertexC_initial.x);
    const maxX = Math.max(vertexA_initial.x, vertexB_initial.x, vertexC_initial.x);
    const minY = Math.min(vertexA_initial.y, vertexB_initial.y, vertexC_initial.y);
    const maxY = Math.max(vertexA_initial.y, vertexB_initial.y, vertexC_initial.y);

    const triangleWidth = maxX - minX;
    const triangleHeight = maxY - minY;

    // Determine scale factor to fit within canvas padding
    const availableWidth = canvas.width - 2 * CANVAS_PADDING;
    const availableHeight = canvas.height - 2 * CANVAS_PADDING;

    const scaleX = triangleWidth === 0 ? 1 : availableWidth / triangleWidth;
    const scaleY = triangleHeight === 0 ? 1 : availableHeight / triangleHeight;
    const scale = Math.min(scaleX, scaleY); // Use the smaller scale factor to fit completely

    // Calculate translation to center the scaled triangle
    const scaledWidth = triangleWidth * scale;
    const scaledHeight = triangleHeight * scale;
    const translateX = (canvas.width - scaledWidth) / 2 - (minX * scale);
    const translateY = (canvas.height - scaledHeight) / 2 - (minY * scale);

    // 6. Calculate Final Screen Coordinates for Vertices
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

    // 7. Draw Triangle Sides
    ctx.beginPath();
    ctx.moveTo(vertexA.x, vertexA.y);
    ctx.lineTo(vertexB.x, vertexB.y);
    ctx.lineTo(vertexC.x, vertexC.y);
    ctx.closePath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 8. Draw Side Labels (a, b, c)
    ctx.fillStyle = '#337ab7'; // Blue color for side labels
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Label side a (opposite Vertex A - connects B and C)
    drawLabel(`a = ${ladoA_input.toFixed(2)} u`, vertexB, vertexC, ctx, LABEL_OFFSET);
    // Label side b (opposite Vertex B - connects A and C)
    drawLabel(`b = ${ladoB_input.toFixed(2)} u`, vertexA, vertexC, ctx, LABEL_OFFSET);
    // Label side c (opposite Vertex C - connects A and B)
    drawLabel(`c = ${ladoC.toFixed(2)} u`, vertexA, vertexB, ctx, LABEL_OFFSET);

    // 9. Draw Angle Arcs and Labels (A, B, C)
    // Angle A (at Vertex A)
    drawAngleArc(ctx, vertexA, vertexC, vertexB, ANGLE_ARC_RADIUS, '#d9534f'); // Red
    drawAngleLabel(ctx, vertexA, vertexC, vertexB, ANGLE_LABEL_OFFSET, `${anguloA_deg.toFixed(1)}°`, '#d9534f');
    // Angle B (at Vertex B)
    drawAngleArc(ctx, vertexB, vertexA, vertexC, ANGLE_ARC_RADIUS, '#5cb85c'); // Green
    drawAngleLabel(ctx, vertexB, vertexA, vertexC, ANGLE_LABEL_OFFSET, `${anguloB_deg.toFixed(1)}°`, '#5cb85c');
    // Angle C (at Vertex C)
    drawAngleArc(ctx, vertexC, vertexB, vertexA, ANGLE_ARC_RADIUS, '#428bca'); // Blue
    drawAngleLabel(ctx, vertexC, vertexB, vertexA, ANGLE_LABEL_OFFSET, `${anguloC_input_deg.toFixed(1)}°`, '#428bca');


    // 10. Display Calculated Results
    mostrarResultados(ladoA_input, ladoB_input, ladoC, anguloA_deg, anguloB_deg, anguloC_input_deg);
}

// --- Helper Drawing Functions ---

/** Draws a label near the midpoint of the segment connecting p1 and p2. */
function drawLabel(text, p1, p2, ctx, offset) {
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x); // Angle of the segment
    const labelAngle = angle + Math.PI / 2; // Perpendicular angle for offset

    const labelX = midX + offset * Math.cos(labelAngle);
    const labelY = midY + offset * Math.sin(labelAngle);

    // Adjust text rotation slightly for better readability if needed (optional)
    // let textAngle = angle;
    // if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) {
    //     textAngle += Math.PI; // Flip text if upside down
    // }
    // ctx.save();
    // ctx.translate(labelX, labelY);
    // ctx.rotate(textAngle);
    // ctx.fillText(text, 0, 0);
    // ctx.restore();

    // Simpler non-rotated text:
     ctx.fillText(text, labelX, labelY);

}

/** Draws an arc representing the angle at vertex P, between segments P->P1 and P->P2. */
function drawAngleArc(ctx, P, P1, P2, radius, color) {
    const angle1 = Math.atan2(P1.y - P.y, P1.x - P.x);
    const angle2 = Math.atan2(P2.y - P.y, P2.x - P.x);

    ctx.beginPath();
    ctx.arc(P.x, P.y, radius, angle1, angle2);
    // Check if arc should be drawn counter-clockwise if angle wraps around
    // This simple version might draw the larger arc sometimes, but usually okay for triangles.
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

/** Draws the angle value near the angle arc. */
function drawAngleLabel(ctx, P, P1, P2, offset, text, color) {
    const angle1 = Math.atan2(P1.y - P.y, P1.x - P.x);
    const angle2 = Math.atan2(P2.y - P.y, P2.x - P.x);
    let midAngle = (angle1 + angle2) / 2;

    // Adjust midAngle if the arc crosses the 0/2PI boundary in standard atan2 range
     if (Math.abs(angle1 - angle2) > Math.PI) {
         midAngle += Math.PI;
     }
     // Ensure text isn't placed exactly on a line if angle is ~180 (rare in valid triangles)
     if (Math.abs(Math.abs(angle1 - angle2) - Math.PI) < 0.01) {
         midAngle += 0.1; // slight offset
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
    // Use the SAS formula for area with input values for higher precision
    const area = 0.5 * a * b * Math.sin(angC * Math.PI / 180);
    const perimetro = a + b + c;
    let tipoLado = '';
    let tipoAngulo = '';

    // Tolerance for floating point comparisons
    const epsilon = 0.01;

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
    } else if (angles.some(angle => angle > 90)) {
        tipoAngulo = "Obtusângulo";
    } else {
        tipoAngulo = "Acutângulo";
    }

    const tipo = `${tipoLado} ${tipoAngulo}`;

    document.getElementById('resultado').innerHTML = `
    <b>Resultados:</b><br>
    Lado a: ${a.toFixed(2)} u<br>
    Lado b: ${b.toFixed(2)} u<br>
    Lado c: ${c.toFixed(2)} u<br>
    Ângulo A: ${angA.toFixed(1)}°<br>
    Ângulo B: ${angB.toFixed(1)}°<br>
    Ângulo C: ${angC.toFixed(1)}°<br>
    --------------------<br>
    Área: ${area.toFixed(2)} u²<br>
    Perímetro: ${perimetro.toFixed(2)} u<br>
    Tipo: ${tipo}<br>
  `;
}

/** Clears the canvas and results display */
function clearCanvasAndResults() {
     const canvas = document.getElementById('meuCanvas');
     const ctx = canvas.getContext('2d');
     ctx.clearRect(0, 0, canvas.width, canvas.height);
     document.getElementById('resultado').innerHTML = `
        <b>Resultados:</b><br>
        Aguardando entrada...
     `;
}


/** Downloads the current canvas drawing as a PNG image. */
function baixarImagem() {
    const canvas = document.getElementById('meuCanvas');
    // Check if canvas is blank (optional, but good practice)
    if (isCanvasBlank(canvas)) {
        alert("Desenhe um triângulo antes de baixar a imagem.");
        return;
    }
    const link = document.createElement('a');
    link.download = 'triangulo_calculado.png';
    link.href = canvas.toDataURL('image/png'); // Specify PNG format
    link.click();
    link.remove(); // Clean up the temporary link
}

/** Generates a PDF report with the drawing and results. */
function gerarPDF() {
    const canvas = document.getElementById('meuCanvas');
     if (isCanvasBlank(canvas)) {
        alert("Desenhe um triângulo antes de gerar o PDF.");
        return;
    }
    const { jsPDF } = window.jspdf; // Ensure jsPDF is loaded
    const pdf = new jsPDF({ // Specify orientation based on canvas aspect ratio potentially
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'pt', // Use points for easier scaling
        format: 'a4'
    });

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const margin = 40; // PDF margin in points
    const pdfWidth = pdf.internal.pageSize.getWidth() - 2 * margin;
    const pdfHeight = pdf.internal.pageSize.getHeight() - 2 * margin;

    // Calculate scaling factor to fit image within PDF page margins
    const imgScale = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
    const imgWidth = canvasWidth * imgScale;
    const imgHeight = canvasHeight * imgScale;

    // --- Add Content to PDF ---
    pdf.setFontSize(18);
    pdf.text("Relatório do Triângulo Interativo", margin, margin);

    // Add the canvas image
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', margin, margin + 30, imgWidth, imgHeight);

    // Add the results text below the image
    const textoResultados = document.getElementById('resultado').innerText;
    pdf.setFontSize(11);
    // Use splitTextToSize for automatic line wrapping if text is too long
    const textLines = pdf.splitTextToSize(textoResultados, pdfWidth);
    pdf.text(textLines, margin, margin + 30 + imgHeight + 25); // Position text below image

    pdf.save("relatorio_triangulo.pdf");
}

/** Checks if the canvas is effectively blank. */
function isCanvasBlank(canvas) {
    const context = canvas.getContext('2d');
    const pixelBuffer = new Uint32Array(
        context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    // Check if all pixels are transparent (or white, depending on default background)
    // A simpler check might just look for non-zero pixels after a clearRect
    return !pixelBuffer.some(pixel => pixel !== 0);
}