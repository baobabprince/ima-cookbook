import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { Recipe } from '../types/recipe';
import { formatIngredient, MOMS_NOTEBOOK_CONVERSIONS } from './conversions';

export async function exportRecipesToWord(recipes: Recipe[]): Promise<void> {
  const sortedRecipes = [...recipes].sort((a, b) => a.orderIndex - b.orderIndex);

  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: 'המטבח של אמא',
          bold: true,
          size: 56,
          font: 'David',
          rightToLeft: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      bidirectional: true,
      spacing: { after: 500 },
      border: {
        bottom: { color: '999999', space: 12, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [
        new TextRun({
          text: `ספר המתכונים המלא — ${sortedRecipes.length} מתכונים ערוכים לפי הסדר המקורי`,
          size: 26,
          font: 'Arial',
          color: '555555',
          rightToLeft: true,
        }),
      ],
    })
  );

  // Mom's Unit Conversion Section
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      spacing: { before: 300, after: 160 },
      children: [
        new TextRun({
          text: 'המרת יחידות ומידות אפייה',
          bold: true,
          size: 32,
          font: 'David',
          rightToLeft: true,
        }),
      ],
    })
  );

  for (const row of MOMS_NOTEBOOK_CONVERSIONS) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `• ${row.title} = ${row.equivalent}`,
            bold: true,
            size: 24,
            font: 'Arial',
            rightToLeft: true,
          }),
          ...(row.note
            ? [
                new TextRun({
                  text: ` (${row.note})`,
                  size: 22,
                  color: '555555',
                  font: 'Arial',
                  rightToLeft: true,
                }),
              ]
            : []),
        ],
      })
    );
  }

  // Table of Contents list
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      pageBreakBefore: true,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: 'תוכן העניינים (לפי סדר הופעת המתכונים)',
          bold: true,
          size: 32,
          font: 'David',
          rightToLeft: true,
        }),
      ],
    })
  );

  for (const r of sortedRecipes) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: `${r.orderIndex}. ${r.title}`,
            bold: true,
            size: 22,
            font: 'Arial',
            rightToLeft: true,
          }),
          new TextRun({
            text: `  [${r.category}${r.source ? ` · ${r.source}` : ''}]`,
            size: 20,
            color: '666666',
            font: 'Arial',
            rightToLeft: true,
          }),
        ],
      })
    );
  }

  // Recipes
  for (const recipe of sortedRecipes) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { before: 420, after: 100 },
        border: {
          top: { color: 'CCCCCC', space: 8, style: BorderStyle.SINGLE, size: 6 },
        },
        children: [
          new TextRun({
            text: `${recipe.orderIndex}. ${recipe.title}`,
            bold: true,
            size: 30,
            font: 'David',
            rightToLeft: true,
          }),
        ],
      })
    );

    const metaParts: string[] = [recipe.category];
    if (recipe.source) metaParts.push(`מקור/הערה: ${recipe.source}`);
    if (recipe.yieldText) metaParts.push(`כמות/תבנית: ${recipe.yieldText}`);
    if (recipe.ovenTemp) metaParts.push(`חום תנור: ${recipe.ovenTemp}`);

    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: metaParts.join('  |  '),
            italics: true,
            size: 20,
            color: '555555',
            font: 'Arial',
            rightToLeft: true,
          }),
        ],
      })
    );

    if (recipe.prepNote) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { after: 140 },
          children: [
            new TextRun({
              text: recipe.prepNote,
              size: 22,
              color: '333333',
              font: 'Arial',
              rightToLeft: true,
            }),
          ],
        })
      );
    }

    // Ingredients
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({
            text: 'מצרכים:',
            bold: true,
            size: 24,
            font: 'Arial',
            rightToLeft: true,
          }),
        ],
      })
    );

    for (const group of recipe.ingredientGroups) {
      if (group.groupTitle) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 80, after: 40 },
            children: [
              new TextRun({
                text: `${group.groupTitle}:`,
                bold: true,
                size: 22,
                color: '444444',
                font: 'Arial',
                rightToLeft: true,
              }),
            ],
          })
        );
      }

      for (const ing of group.items) {
        const formatted = formatIngredient(ing, 1, 'original', 'original');
        const qtyPart = [formatted.displayAmount, formatted.displayUnit]
          .filter(Boolean)
          .join(' ');
        const fullLine = [
          qtyPart,
          formatted.displayItem,
          formatted.displayNote ? `(${formatted.displayNote})` : '',
        ]
          .filter(Boolean)
          .join(' ');

        children.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `• ${fullLine}`,
                size: 22,
                font: 'Arial',
                rightToLeft: true,
              }),
            ],
          })
        );
      }
    }

    // Steps
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        bidirectional: true,
        spacing: { before: 140, after: 80 },
        children: [
          new TextRun({
            text: 'אופן ההכנה:',
            bold: true,
            size: 24,
            font: 'Arial',
            rightToLeft: true,
          }),
        ],
      })
    );

    recipe.steps.forEach((step, idx) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: `${idx + 1}. ${step.text}`,
              size: 22,
              font: 'Arial',
              rightToLeft: true,
            }),
          ],
        })
      );
    });

    if (recipe.tips && recipe.tips.length > 0) {
      for (const tip of recipe.tips) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: `טיפ: ${tip}`,
                italics: true,
                size: 21,
                color: '444444',
                font: 'Arial',
                rightToLeft: true,
              }),
            ],
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'המטבח_של_אמא_ספר_מתכונים.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
