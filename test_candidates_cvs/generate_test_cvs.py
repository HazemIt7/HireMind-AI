import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

out_dir = "/home/hazem/Desktop/stage/test_candidates_cvs"
os.makedirs(out_dir, exist_ok=True)

candidates = [
    {
        "filename": "CV_Hazem_Ayachi.pdf",
        "name": "Hazem Ayachi",
        "email": "hazem.ayachi@hiremind.ai",
        "phone": "+216 29 888 123",
        "job": "Ingénieur Cybersécurité & Développeur Fullstack",
        "skills": "Pentesting, Wazuh SIEM, CEH, NestJS, Flutter, Docker, PostgreSQL, Python",
        "summary": "Ingénieur passionné par la sécurité offensive, l'analyse SIEM avec Wazuh et la création d'architectures microservices haute performance avec NestJS et Flutter.",
        "exp": "4 ans d'expérience en audit de sécurité, développement d'applications mobiles sécurisées et conteneurisation."
    },
    {
        "filename": "CV_Sarra_Mansouri.pdf",
        "name": "Sarra Mansouri",
        "email": "sarra.mansouri@hiremind.ai",
        "phone": "+216 98 765 432",
        "job": "Ingénieure DevOps & Sécurité Réseau",
        "skills": "CCNA, Cisco, Kubernetes, CI/CD, TCP/IP, Wazuh, Terraform, Linux",
        "summary": "Spécialiste de la sécurisation d'infrastructures réseau, automatisation CI/CD et déploiement de clusters Kubernetes haute disponibilité.",
        "exp": "3.5 ans d'expérience en ingénierie système et réseau et monitoring de sécurité."
    },
    {
        "filename": "CV_Amine_Ben_Salem.pdf",
        "name": "Amine Ben Salem",
        "email": "amine.bensalem@hiremind.ai",
        "phone": "+216 55 432 109",
        "job": "Développeur Mobile Senior Flutter & Clean Architecture",
        "skills": "Flutter, Dart, BLoC, Clean Architecture, REST API, Firebase, Unit Testing",
        "summary": "Expert Flutter développant des applications mobiles multiplateformes scalables avec gestion d'état réactive BLoC et Clean Architecture.",
        "exp": "5 ans d'expérience en développement mobile Android/iOS et intégration d'API backend."
    },
    {
        "filename": "CV_Youssef_Trabelsi.pdf",
        "name": "Youssef Trabelsi",
        "email": "youssef.trabelsi@hiremind.ai",
        "phone": "+216 22 111 333",
        "job": "Ingénieur Automatisme & IoT Industriel",
        "skills": "PLC Automates, SCADA, Génie Électrique, Python, C++, Modbus, IoT",
        "summary": "Ingénieur en génie électrique spécialisé dans la programmation d'automates industriels, la supervision SCADA et la communication IoT.",
        "exp": "2 ans d'expérience en intégration d'automates Siemens/Schneider et supervision d'usines."
    },
    {
        "filename": "CV_Leila_Ghorbel.pdf",
        "name": "Leila Ghorbel",
        "email": "leila.ghorbel@hiremind.ai",
        "phone": "+216 20 999 888",
        "job": "Data Scientist & Spécialiste IA Générative",
        "skills": "Python, Qdrant Vector DB, PyTorch, FastAPI, LLM Prompting, Transformers",
        "summary": "Chercheuse et ingénieure en IA spécialisée dans les bases de données vectorielles (Qdrant), le RAG et les moteurs de recherche sémantique.",
        "exp": "6 ans d'expérience en apprentissage profond, NLP et développement d'APIs IA."
    }
]

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Heading1'],
    fontSize=22,
    textColor=colors.HexColor('#0f172a'),
    spaceAfter=4
)

subtitle_style = ParagraphStyle(
    'DocSubTitle',
    parent=styles['Heading2'],
    fontSize=14,
    textColor=colors.HexColor('#06b6d4'),
    spaceAfter=12
)

body_style = ParagraphStyle(
    'DocBody',
    parent=styles['Normal'],
    fontSize=10,
    textColor=colors.HexColor('#334155'),
    spaceAfter=8
)

bold_style = ParagraphStyle(
    'DocBold',
    parent=styles['Normal'],
    fontSize=11,
    textColor=colors.HexColor('#1e293b'),
    fontName='Helvetica-Bold',
    spaceAfter=4
)

for c in candidates:
    filepath = os.path.join(out_dir, c["filename"])
    doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []

    story.append(Paragraph(c["name"], title_style))
    story.append(Paragraph(c["job"], subtitle_style))
    story.append(Paragraph(f"Email : {c['email']} | Tel : {c['phone']}", body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Résumé Professionnel", bold_style))
    story.append(Paragraph(c["summary"], body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Compétences Clés (Extrait IA)", bold_style))
    story.append(Paragraph(c["skills"], body_style))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Expérience & Projets", bold_style))
    story.append(Paragraph(c["exp"], body_style))

    doc.build(story)
    print(f"Généré : {filepath}")

print("Tous les CVs ont été générés avec succès !")
