import io
import logging
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT

logger = logging.getLogger(__name__)

class DocumentGenerator:
    """
    Handles generation of different document formats from text content
    """
    
    @staticmethod
    def generate_docx(text):
        """
        Generate a Word document from text
        
        Args:
            text (str): The text content to include in the document
            
        Returns:
            io.BytesIO: A buffer containing the Word document
        """
        try:
            # Create Word document
            doc = Document()
            for paragraph in text.split('\n'):
                doc.add_paragraph(paragraph)
            
            # Save to memory buffer
            buffer = io.BytesIO()
            doc.save(buffer)
            buffer.seek(0)
            
            return buffer
        except Exception as e:
            logger.error(f"Error generating Word document: {e}")
            raise
    
    @staticmethod
    def generate_pdf(text):
        """
        Generate a PDF document from text
        
        Args:
            text (str): The text content to include in the document
            
        Returns:
            io.BytesIO: A buffer containing the PDF document
        """
        try:
            buffer = io.BytesIO()
            
            # Create a document template with proper margins
            doc = SimpleDocTemplate(
                buffer,
                pagesize=letter,
                rightMargin=72,  # 1 inch
                leftMargin=72,   # 1 inch
                topMargin=72,    # 1 inch
                bottomMargin=72  # 1 inch
            )
            
            # Create styles
            styles = getSampleStyleSheet()
            normal_style = ParagraphStyle(
                'NormalWithSpacing',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=11,
                leading=14,  # Line height
                alignment=TA_LEFT,
                spaceAfter=10
            )
            
            # Process the text into paragraphs
            story = []
            for line in text.split('\n'):
                # Skip empty lines but add space
                if not line.strip():
                    story.append(Spacer(1, 12))
                    continue
                
                # Add the paragraph with proper encoding
                p = Paragraph(line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'), normal_style)
                story.append(p)
            
            # Build the document
            doc.build(story)
            
            buffer.seek(0)
            return buffer
        except Exception as e:
            logger.error(f"Error generating PDF document: {e}")
            raise
