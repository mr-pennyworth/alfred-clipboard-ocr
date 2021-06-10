<h1 align="center">
  
<a href="https://github.com/mr-pennyworth/alfred-clipboard-ocr/releases/latest/">
  <img src="icon.png" width="16%"><br/>
  <img alt="Download"
       src="https://img.shields.io/github/downloads/mr-pennyworth/alfred-clipboard-ocr/total?color=purple&label=Download"><br/>
</a>
  Clipboard History OCR for Alfred
</h1>

Make images in [Alfred](https://alfredapp.com)'s clipboard history
searchable by their text content.

Alfred's clipboard history includes images too.
However, there's no way to search through them.
For example, in the screenshots below, are two images in the clipboard history,
but the only "searchable" information about them is dimensions and size.
![](screenshots/before-1.png) ![](screenshots/before-2.png)

This tool runs OCR every time an image is copied to clipboard,
and makes the image searchable using that text. 
![](screenshots/after-1.png) ![](screenshots/after-2.png)
![](screenshots/after-3.png)

### Setup
 1. Download the [latest release](https://github.com/mr-pennyworth/alfred-clipboard-ocr/releases/latest/download/Clipboard.History.OCR.alfredworkflow).
 2. Type `.clipboard-history-ocr-install`
 3. Done!


### Uninstall
 1. Run `.clipboard-history-ocr-uninstall` in Alfred.
 2. Delete the workflow from Alfred.


### Credits
 - [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
 - [Mac dilyb bundler](https://github.com/auriamg/macdylibbundler)
 - Icon made by combining icons from [flaticon](https://www.flaticon.com)
   by [Pixel Perfect](https://www.flaticon.com/authors/pixel-perfect) and
   [Dimitry Miroliubov](https://www.flaticon.com/authors/dimitry-miroliubov).
