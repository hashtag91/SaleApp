from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from datetime import datetime

def generer_facture(nom_client, adresse_client, items, total, numero_facture):
    fichier = f"facture_{numero_facture}.pdf"
    c = canvas.Canvas(fichier, pagesize=A4)
    largeur, hauteur = A4

    # En-tête entreprise
    c.setFont("Helvetica-Bold", 16)
    c.drawString(20 * mm, hauteur - 30 * mm, "CAM'S FASHION")
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, hauteur - 35 * mm, "Rue des affaires, Bamako, Mali")
    c.drawString(20 * mm, hauteur - 40 * mm, "Tel: +223 70 00 00 00")
    c.drawString(20 * mm, hauteur - 45 * mm, "Email: contact@camsfashion.ml")

    # Ligne de séparation
    c.line(20 * mm, hauteur - 50 * mm, 190 * mm, hauteur - 50 * mm)

    # Informations client
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20 * mm, hauteur - 60 * mm, f"Facture N°: {numero_facture}")
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, hauteur - 70 * mm, f"Date: {datetime.now().strftime('%d/%m/%Y')}")
    c.drawString(20 * mm, hauteur - 80 * mm, f"Client: {nom_client}")
    c.drawString(20 * mm, hauteur - 90 * mm, f"Adresse: {adresse_client}")

    # Tableau des articles
    c.setFont("Helvetica-Bold", 10)
    c.drawString(20 * mm, hauteur - 110 * mm, "Description")
    c.drawString(100 * mm, hauteur - 110 * mm, "Qté")
    c.drawString(120 * mm, hauteur - 110 * mm, "Prix Unitaire")
    c.drawString(160 * mm, hauteur - 110 * mm, "Total")

    y = hauteur - 120 * mm
    c.setFont("Helvetica", 10)
    for item in items:
        description, quantite, prix_unitaire = item
        total_ligne = quantite * prix_unitaire

        c.drawString(20 * mm, y, description)
        c.drawString(100 * mm, y, str(quantite))
        c.drawString(120 * mm, y, f"{prix_unitaire:.2f} FCFA")
        c.drawString(160 * mm, y, f"{total_ligne:.2f} FCFA")
        y -= 10 * mm

    # Total général
    c.line(120 * mm, y - 5 * mm, 190 * mm, y - 5 * mm)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(120 * mm, y - 15 * mm, "Total:")
    c.drawString(160 * mm, y - 15 * mm, f"{total:.2f} FCFA")

    c.showPage()
    c.save()
    print(f"Facture générée : {fichier}")

# Exemple d'utilisation
items = [
    ("T-shirt CAM'S FASHION", 2, 5000),
    ("Jean slim", 1, 15000),
    ("Casquette logo", 3, 3000)
]

total_general = sum(q * p for _, q, p in items)

generer_facture("M. Yacouba Camara", "Quartier des affaires, Bamako", items, total_general, "20240623-001")