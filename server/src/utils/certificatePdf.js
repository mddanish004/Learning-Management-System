import PDFDocument from 'pdfkit';

function formatIssueDate(issuedAt) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(issuedAt);
}

function truncateText(value, maxLength) {
  const input = typeof value === 'string' ? value.trim() : '';
  if (!input) {
    return '';
  }
  return input.length > maxLength ? `${input.slice(0, maxLength - 3)}...` : input;
}

export async function renderCertificatePdf({
  certificateId,
  learnerName,
  courseTitle,
  issuedAt,
}) {
  return await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      info: {
        Title: 'Course Completion Certificate',
        Author: 'LMS',
      },
    });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const issuedText = formatIssueDate(issuedAt);
    const safeLearnerName = truncateText(learnerName, 80) || 'Learner';
    const safeCourseTitle = truncateText(courseTitle, 120) || 'Course';

    doc.rect(0, 0, pageWidth, pageHeight).fill('#f8fafc');
    doc.rect(36, 36, pageWidth - 72, pageHeight - 72).lineWidth(2).strokeColor('#0f172a').stroke();
    doc.rect(56, 56, pageWidth - 112, pageHeight - 112).lineWidth(1).strokeColor('#cbd5e1').stroke();

    doc.rect(56, 56, pageWidth - 112, 95).fill('#0f172a');
    doc.fillColor('#f8fafc');
    doc.font('Helvetica-Bold').fontSize(14).text('LEARNING MANAGEMENT SYSTEM', 56, 92, {
      width: pageWidth - 112,
      align: 'center',
    });

    doc.fillColor('#334155');
    doc.font('Helvetica').fontSize(17).text('Certificate of Completion', 56, 205, {
      width: pageWidth - 112,
      align: 'center',
    });

    doc.fillColor('#0f172a');
    doc.font('Helvetica-Bold').fontSize(41).text(safeLearnerName, 90, 255, {
      width: pageWidth - 180,
      align: 'center',
    });

    doc.fillColor('#475569');
    doc.font('Helvetica').fontSize(15).text('has successfully completed', 56, 338, {
      width: pageWidth - 112,
      align: 'center',
    });

    doc.fillColor('#0f172a');
    doc.font('Helvetica-Bold').fontSize(28).text(safeCourseTitle, 90, 372, {
      width: pageWidth - 180,
      align: 'center',
    });

    doc.moveTo(170, 455).lineTo(pageWidth - 170, 455).lineWidth(1).strokeColor('#94a3b8').stroke();

    doc.fillColor('#475569');
    doc.font('Helvetica').fontSize(12).text(`Issued on ${issuedText}`, 90, 478, {
      width: pageWidth - 180,
      align: 'center',
    });
    doc.text(`Certificate ID ${certificateId}`, 90, 497, {
      width: pageWidth - 180,
      align: 'center',
    });

    doc.circle(pageWidth - 120, pageHeight - 120, 46).lineWidth(2).strokeColor('#0f172a').stroke();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text('LMS', pageWidth - 136, pageHeight - 129, {
      width: 32,
      align: 'center',
    });
    doc.font('Helvetica').fontSize(8).fillColor('#64748b').text('VERIFIED', pageWidth - 144, pageHeight - 112, {
      width: 48,
      align: 'center',
    });

    doc.end();
  });
}
