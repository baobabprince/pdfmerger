
async function mergePDFs(pdf1, pdf2Array, onProgress) {
  const mergedPdfArray = [];

  const pdf1Doc = await PDFLib.PDFDocument.load(pdf1);
  const pageCount = pdf1Doc.getPageCount() + pdf2Array.reduce((total, pdf2) => total + PDFLib.PDFDocument.load(pdf2).then(doc => doc.getPageCount()), 0);

  for (let j = 0; j < pdf2Array.length; j++) {
    const pdfDoc = await PDFLib.PDFDocument.create();
    for (let i = 0; i < pdf1Doc.getPageCount(); i++) {
      const [pdf1Page] = await pdfDoc.copyPages(pdf1Doc, [i]);
      pdfDoc.addPage(pdf1Page);
    }

    const pdf2Doc = await PDFLib.PDFDocument.load(pdf2Array[j]);
    for (let i = 0; i < pdf2Doc.getPageCount(); i++) {
      const [pdf2Page] = await pdfDoc.copyPages(pdf2Doc, [i]);
      pdfDoc.addPage(pdf2Page);
      onProgress((pdf1Doc.getPageCount() + i + j * pdf2Doc.getPageCount()) / pageCount);
    }

    const mergedPdfBytes = await pdfDoc.save();
    mergedPdfArray.push(mergedPdfBytes);
  }

  return mergedPdfArray;
}


const file1Input = document.getElementById('file1');
const file2Input = document.getElementById('file2');
const mergeBtn = document.getElementById('mergeBtn');
const mergedPdfsDiv = document.getElementById('mergedPdfs');

mergeBtn.addEventListener('click', async () => {
  const pdf1 = await file1Input.files[0].arrayBuffer();
  const pdf2Array = [];
  for (let i = 0; i < file2Input.files.length; i++) {
    const pdf2 = await file2Input.files[i].arrayBuffer();
    pdf2Array.push(pdf2);
  }

  const progressBar = document.createElement('div');
  progressBar.classList.add('progress');
  const progressBarInner = document.createElement('div');
  progressBarInner.classList.add('progress-bar');
  progressBarInner.style.width = '0%';
  progressBar.appendChild(progressBarInner);
  mergedPdfsDiv.appendChild(progressBar);

  const mergedPdfArray = await mergePDFs(pdf1, pdf2Array, progress => {
    progressBarInner.style.width = `${progress * 100}%`;
  });

  progressBar.remove();

  mergedPdfsDiv.innerHTML = '';
  for (let j = 0; j < mergedPdfArray.length; j++) {
    const mergedPdfBlob = new Blob([mergedPdfArray[j]], { type: 'application/pdf' });
    const mergedPdfUrl = URL.createObjectURL(mergedPdfBlob);
    const downloadLink = document.createElement('a');
    downloadLink.textContent = `Download Merged File ${j+1}`;
    downloadLink.href = mergedPdfUrl;
    //downloadLink.download = `merged_file_${j+1}.pdf`;
    const fileName = file2Input.files[j].name.replace(/\.[^/.]+$/, "");
    downloadLink.download = `${fileName}_merged.pdf`;
    mergedPdfsDiv.appendChild(downloadLink);
    mergedPdfsDiv.appendChild(document.createElement('br'));
  }
});


async function handleDrop(event, fileInput) {
  event.preventDefault();
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    fileInput.files = files;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // ...
  const file1DropZone = document.getElementById("file1-drop-zone");
  const file2DropZone = document.getElementById("file2-drop-zone");

  // Handle drag and drop for file 1
  file1DropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
  file1DropZone.addEventListener("drop", (event) => {
    handleDrop(event, file1Input);
  });

  // Handle drag and drop for file 2
  file2DropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
  file2DropZone.addEventListener("drop", (event) => {
    handleDrop(event, file2Input);
  });
});
