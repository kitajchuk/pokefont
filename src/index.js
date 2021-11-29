import './index.css';

import makerjs from 'makerjs';
import opentype from 'opentype.js';

const elSVG = document.getElementById('svg');
const elText = document.getElementById('text');
const elDownload = document.getElementById('download');

const loadFont = async () => {
  const font = await opentype.load('./PokeFont.otf');
  return font;
};

const getHiLoX = (path) => {
  let hiX = 0;
  let loX = 1000000;

  for (let i in path.pathSegList) {
    for (let j in path.pathSegList[i]) {
      if (/x/.test(j)) {
        if (path.pathSegList[i][j] > hiX) {
          hiX = path.pathSegList[i][j];
        }

        if (path.pathSegList[i][j] < loX) {
          loX = path.pathSegList[i][j];
        }
      }
    }
  }

  return { hiX, loX };
};

const render = (font, text) => {
  const textModel = new makerjs.models.Text(
    font,
    text,
    200,
    false,
    false,
    undefined,
    {
      kerning: true,
    }
  );

  // Put each letter on it's own "layer", or <path>
  for (let i in textModel.models) {
    textModel.models[i].layer = `layer${i}`;
  }

  const svg = makerjs.exporter.toSVG(textModel, {
    fill: 'black',
    useSvgPathOnly: true,
  });

  elSVG.innerHTML = svg;

  const svgGroup = document.getElementById('svgGroup');
  const svgPaths = svgGroup.getElementsByTagName('path');

  // Start at 1 so we don't kern back the first letter
  for (let i = 1; i < svgPaths.length; i++) {
    let hiLoCurr = getHiLoX(svgPaths[i]);
    const hiLoLast = getHiLoX(svgPaths[i - 1]);

    while (hiLoCurr.loX > hiLoLast.hiX) {
      for (let j in svgPaths[i].pathSegList) {
        for (let k in svgPaths[i].pathSegList[j]) {
          if (/x/.test(k)) {
            svgPaths[i].pathSegList[j][k] = svgPaths[i].pathSegList[j][k] - 30;
          }
        }
      }

      hiLoCurr = getHiLoX(svgPaths[i]);
    }
  }

  const svgFile = window.btoa(elSVG.innerHTML);

  elDownload.href = `data:image/svg+xml;base64,${svgFile}`;
  elDownload.download = elText.value;
};

window.onload = async () => {
  const font = await loadFont();

  window.PokeFont = font;

  document.addEventListener('keyup', (e) => {
    if (document.activeElement === elText) {
      elText.value = elText.value.replace(/\s/g, '');
      render(font, elText.value.replace(/\s/g, ''));
    }
  }, false);

  // Default text value
  elText.value = 'bk';

  render(font, elText.value);
};