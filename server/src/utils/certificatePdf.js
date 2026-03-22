import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = join(__dirname, '../../assets/penta-academy-logo.png');

const CREAM = '#F5F0E8';
const CORAL = '#FF6B6B';
const CHARCOAL = '#1A1A2E';
const SUNSHINE = '#FFD43B';
const MINT = '#A7F3D0';
const BLACK = '#000000';

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
        Author: 'Penta Academy',
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

    const outer = 36;
    const inner = 48;
    const headerH = 102;

    doc.rect(0, 0, pageWidth, pageHeight).fill(CREAM);

    doc
      .rect(outer, outer, pageWidth - outer * 2, pageHeight - outer * 2)
      .lineWidth(3)
      .strokeColor(BLACK)
      .stroke();

    doc
      .rect(inner, inner, pageWidth - inner * 2, headerH)
      .fill(CORAL);

    doc
      .moveTo(inner, inner + headerH)
      .lineTo(pageWidth - inner, inner + headerH)
      .lineWidth(2)
      .strokeColor(BLACK)
      .stroke();

    doc.fillColor('#ffffff');
    doc.font('Helvetica-Bold').fontSize(13).text('PENTA ACADEMY', inner, inner + 38, {
      width: pageWidth - inner * 2,
      align: 'center',
    });

    doc.fillColor(CHARCOAL);
    doc.font('Helvetica-Bold').fontSize(20).text('Certificate of Completion', inner, inner + headerH + 36, {
      width: pageWidth - inner * 2,
      align: 'center',
    });

    doc.fillColor(BLACK);
    doc.font('Helvetica-Bold').fontSize(38).text(safeLearnerName, inner + 42, inner + headerH + 92, {
      width: pageWidth - inner * 2 - 84,
      align: 'center',
    });

    doc.fillColor('#374151');
    doc.font('Helvetica').fontSize(14).text('has successfully completed', inner, inner + headerH + 168, {
      width: pageWidth - inner * 2,
      align: 'center',
    });

    doc.fillColor(BLACK);
    doc.font('Helvetica-Bold').fontSize(24).text(safeCourseTitle, inner + 42, inner + headerH + 200, {
      width: pageWidth - inner * 2 - 84,
      align: 'center',
    });

    doc
      .rect(inner + 100, inner + headerH + 290, pageWidth - inner * 2 - 200, 6)
      .fill(MINT);

    doc.fillColor('#4b5563');
    doc.font('Helvetica').fontSize(11).text(`Issued on ${issuedText}`, inner, inner + headerH + 318, {
      width: pageWidth - inner * 2,
      align: 'center',
    });
    doc.text(`Certificate ID ${certificateId}`, inner, inner + headerH + 336, {
      width: pageWidth - inner * 2,
      align: 'center',
    });

    const stampW = 108;
    const stampH = 118;
    const stampX = pageWidth - inner - stampW;
    const stampY = pageHeight - inner - stampH;

    doc.rect(stampX, stampY, stampW, stampH).fill(SUNSHINE);
    doc
      .rect(stampX, stampY, stampW, stampH)
      .lineWidth(2)
      .strokeColor(BLACK)
      .stroke();

    const logoSize = 52;
    const logoX = stampX + (stampW - logoSize) / 2;
    const logoY = stampY + 14;

    if (existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, logoX, logoY, { width: logoSize, height: logoSize });
      } catch {
        doc.fillColor(BLACK);
        doc.font('Helvetica-Bold').fontSize(11).text('PA', stampX + 40, stampY + 44, {
          width: 32,
          align: 'center',
        });
      }
    } else {
      doc.fillColor(BLACK);
      doc.font('Helvetica-Bold').fontSize(11).text('PA', stampX + 40, stampY + 44, {
        width: 32,
        align: 'center',
      });
    }

    doc.fillColor(CHARCOAL);
    doc.font('Helvetica-Bold').fontSize(9).text('VERIFIED', stampX, stampY + logoSize + 22, {
      width: stampW,
      align: 'center',
    });
    doc.font('Helvetica').fontSize(7).fillColor('#4b5563').text('Penta Academy', stampX, stampY + logoSize + 36, {
      width: stampW,
      align: 'center',
    });

    doc.end();
  });
}
