import requests
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

url = '$(url_servidor)/health'
email_destinatario = '$(email_destinatario)'
sendgrid_api_key = '$(sendgrid_api_key)'
email_remitente = '$(email_remitente)'

def verificar_servidor(url):
    try:
        respuesta = requests.get(url)
        if respuesta.status_code == 200:
            print(f"El servidor en {url} está funcionando correctamente.")
        else:
            print(f"El servidor en {url} no respondió correctamente. Enviando notificación por correo electrónico.")
            enviar_email(email_destinatario, url)
    except requests.exceptions.RequestException as e:
        print(f"No se pudo conectar al servidor {url}. Enviando notificación por correo electrónico.")
        enviar_email(email_destinatario, url)

def enviar_email(destinatario, url):
    mensaje = Mail(
        from_email=email_remitente,
        to_emails=destinatario,
        subject='Alerta de Salud del Servidor',
        html_content=f'<strong>El servidor en {url} no está respondiendo correctamente. Por favor, verifica el estado del servidor.</strong>')
    try:
        sg = SendGridAPIClient(sendgrid_api_key)
        respuesta = sg.send(mensaje)
        print(f"Correo electrónico enviado. Estado: {respuesta.status_code}")
    except Exception as e:
        print(f"Error al enviar el correo electrónico: {e}")

verificar_servidor(url)