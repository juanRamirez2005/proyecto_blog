# Blog: La tradición semiótica en la comunicación

Es un blog académico de una sola página, hecho con HTML, CSS y JavaScript sin librerías.

## Cómo abrirlo
Haz doble clic en `index.html`. Se abre en cualquier navegador moderno y no necesita servidor.
Las fuentes (Montserrat, Inter y Playfair Display) se cargan desde Google Fonts. Sin internet
el sitio sigue funcionando, pero se ve con fuentes del sistema.

```
blog/
  index.html        página principal
  infografia.html   infografía vertical 1080 × 1920 (enlazada desde la sección 07)
  css/styles.css    estilos (paleta rojo / blanco / negro, modo oscuro, impresión)
  js/main.js        interacciones (menú, índice, quiz, pestañas, modal, etc.)
```

## Qué editar
Busca `<!-- EDITAR -->` en `index.html` (Ctrl+F). Esto es lo que hay que completar:

| Dónde | Qué poner |
|---|---|
| `<meta name="author">` (en el `<head>`) | Nombre de la estudiante |
| Portada (hero): Estudiante, Asignatura, Docente, Fecha | Los datos reales |
| Pie de página: Autora, Asignatura, Docente, Fecha | Los mismos datos |
| Fuentes: referencia de *Estudos Semióticos* | Autor(es), año y título exacto del artículo |
| Sección 6.3: tarjeta de video | Video o imagen propia (ver abajo) |

## Cómo poner el video o una imagen propia (sección 6.3)
Busca el comentario `EDITAR` dentro de `<figure class="video-card">` y reemplaza el bloque
`<div class="video-card__poster"> … </div>` por una de estas opciones:

**Video de YouTube:** en YouTube abre el video y ve a *Compartir → Insertar*. Copia el
`<iframe …>` y pégalo así:

```html
<div class="video-card__poster">
  <iframe src="https://www.youtube.com/embed/ID_DEL_VIDEO" title="Dove Real Beauty Sketches"
          allowfullscreen loading="lazy"></iframe>
</div>
```

**Imagen propia:** crea una carpeta `img/` junto a `index.html`, guarda ahí la imagen y usa:

```html
<div class="video-card__poster">
  <img src="img/dove.jpg" alt="Describe aquí lo que muestra la imagen">
</div>
```

El iframe o la imagen ocupan todo el recuadro, que queda en formato 16:9.
Recuerda citar el origen de la imagen o del video (ver la nota de la sección 10).

## Notas
- Las cajas **“Para profundizar”** y las etiquetas del mismo nombre marcan contenido que
  amplía el informe original. Todo lo demás reproduce el texto del informe.
- El botón de luna/sol cambia entre modo claro y oscuro, y el navegador recuerda la elección.
- Para imprimir o guardar como PDF usa Ctrl+P. La versión impresa oculta el menú y muestra
  todo el contenido de pestañas, acordeones y fichas.
