import { jsPDF } from "jspdf";
import { JournalEntry } from "../types";

/**
 * Exports the authenticated user's journal entries to a clean, professional PDF.
 * Never includes Firebase UID, API keys, project IDs, or secrets.
 */
export function exportJournalToPDF(entries: JournalEntry[], userDisplayName?: string | null) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxLineWidth = pageWidth - margin * 2;
  let y = margin;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text("MindVault Journal Archive", margin, y);
  y += 8;

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  const exportDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const author = userDisplayName ? `Author: ${userDisplayName}  •  ` : "";
  doc.text(`${author}Exported: ${exportDate}  •  Total Entries: ${entries.length}`, margin, y);
  y += 6;

  // Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  if (entries.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text("No journal entries recorded in your private archive.", margin, y);
    doc.save(`mindvault_journal_${new Date().toISOString().split("T")[0]}.pdf`);
    return;
  }

  // Iterate Entries
  entries.forEach((entry, index) => {
    // Page break check for entry header
    if (y > pageHeight - 45) {
      doc.addPage();
      y = margin;
    }

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // slate-900
    const titleText = `${index + 1}. ${entry.title || "Untitled Entry"}`;
    const splitTitle = doc.splitTextToSize(titleText, maxLineWidth);
    doc.text(splitTitle, margin, y);
    y += splitTitle.length * 6;

    // Metadata (Date, Mood, Tags)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    const entryDate = new Date(entry.createdAt).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const moodStr = entry.mood ? `Mood: ${entry.mood}` : "";
    const tagsStr = entry.tags && entry.tags.length > 0 ? `Tags: ${entry.tags.join(", ")}` : "";
    const metaParts = [entryDate, moodStr, tagsStr].filter(Boolean).join("  •  ");
    doc.text(metaParts, margin, y);
    y += 6;

    // Content Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // slate-700
    const splitContent = doc.splitTextToSize(entry.content || "(No content recorded)", maxLineWidth);

    for (let i = 0; i < splitContent.length; i++) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(splitContent[i], margin, y);
      y += 5;
    }
    y += 3;

    // AI Summary box if available
    if (entry.summary) {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }

      doc.setFillColor(245, 243, 255); // violet-50
      doc.setDrawColor(221, 214, 254); // violet-200
      doc.roundedRect(margin, y, maxLineWidth, 22, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(109, 40, 217); // violet-700
      doc.text("AI Summary & Key Themes", margin + 4, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const summaryText = `"${entry.summary.overview}"` +
        (entry.summary.keyThemes?.length ? ` [Themes: ${entry.summary.keyThemes.join(", ")}]` : "");
      const summaryLines = doc.splitTextToSize(summaryText, maxLineWidth - 8);
      doc.text(summaryLines.slice(0, 2), margin + 4, y + 11);
      y += 26;
    }

    // Divider
    y += 4;
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  });

  doc.save(`mindvault_journal_${new Date().toISOString().split("T")[0]}.pdf`);
}
