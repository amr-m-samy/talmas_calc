function UIElement(x, y, width, height, type, ref, subref, slotType) {
  this.x = x;
  this.y = y;
  this.x2 = x + width;
  this.y2 = y + height;
  this.type = type; // 0 = node, 1 = slot, 2 connection
  this.ref = ref;
}

function Bead() {
  this.position = [0.0, 0.0];
  this.value = 0;
  this.active = false;
  this.uniqueID = -1;
}

function AbacusCtrl(type, scale) {
  this.type = type; // 0 Japanese, 1 Chinese
  this.scale = scale;
  this.beadLines = 5;
  this.beadPerLine = this.type == 0 ? 10 : 7;
  this.beadSep = this.type == 0 ? 10 : 4;
  this.beadHeight = 40 * scale;
  this.beadSpacing = 80 * scale;
  this.beadWidth = 60 * scale;
  this.nodes = new Array();

  this.init = function () {
    this.nodes.length = 0;
    var id = 0;
    for (var i = 0; i < this.beadLines; i++) {
      for (var j = 0; j < this.beadPerLine; j++) {
        var bead = new Bead();
        bead.position[0] = 340 * scale - i * this.beadSpacing; //my changes
        bead.position[1] =
          this.beadWidth +
          this.beadPerLine * this.beadHeight -
          j * this.beadHeight;
        bead.value = 1;
        if (j > this.beadSep) {
          bead.position[1] =
            this.beadWidth +
            this.beadPerLine * this.beadHeight -
            (j * this.beadHeight + 2 * this.beadHeight);
          bead.value = 5;
        }
        bead.uniqueID = id;
        this.nodes.push(bead);
        id++;
      }
    }
  };

  this.getBeadsCount = function () {
    return this.nodes.length;
  };

  this.getBeadPositionX = function (nodeId) {
    return this.nodes[nodeId].position[0];
  };

  this.getBeadPositionY = function (nodeId) {
    return this.nodes[nodeId].position[1];
  };

  this.activated = function (nodeId) {
    var line = Math.floor(nodeId / this.beadPerLine);
    var beadInLine = nodeId - line * this.beadPerLine;

    var active = this.nodes[nodeId].active;
    this.nodes[nodeId].active = !active;
    var dir = 1;
    if (beadInLine > this.beadSep) dir = -1;
    // my change The `plus_offset` variable accounts for the displacement applied when placing beads in a column.
    // This is necessary because the displacement might differ based on the total number of beads in the column
    let plus_offset;
    plus_offset =
      !(nodeId === 15 && this.nodes[nodeId].position[1] === 260 * scale) && // this condition ignore first auto activated   abacusCtrl.activated(15);
      !(nodeId === 5 && this.nodes[nodeId].position[1] === 260 * scale) && // this condition ignore first auto activated   abacusCtrl.activated(5);
      nodeId > 0 &&
      nodeId < 20
        ? (plus_offset = 6)
        : (plus_offset = 1);
    var offset = dir * -1 * this.beadHeight * plus_offset;
    if (active) offset = dir * this.beadHeight * plus_offset;
    this.nodes[nodeId].position[1] += offset;
    if (beadInLine <= this.beadSep) {
      for (var j = 0; j < this.beadPerLine; j++) {
        var n = line * this.beadPerLine + j;
        if (j <= this.beadSep && j !== beadInLine) {
          if ((!active && j > beadInLine) || (active && j < beadInLine)) {
            if (this.nodes[n].active === active) {
              this.nodes[n].position[1] += offset;
              this.nodes[n].active = !this.nodes[n].active;
            }
          }
        }
      }
    } else {
      for (var j = 0; j < this.beadPerLine; j++) {
        var n = line * this.beadPerLine + j;
        if (j > this.beadSep && j !== beadInLine) {
          if ((!active && j < beadInLine) || (active && j > beadInLine)) {
            if (this.nodes[n].active === active) {
              this.nodes[n].position[1] += offset;
              this.nodes[n].active = !this.nodes[n].active;
            }
          }
        }
      }
    }
  };
}

function Abacus(parentDivId, type, scale) {
  var abacusCtrl = new AbacusCtrl(type, scale);
  var canvas;
  var divId = parentDivId;

  var uiElements = new Array();
  var that = this;
  let dragging = -1;
  let originalY = {};
  let draggedNow = [];

  document.body.onkeyup = function (e) {
    if (e.key == " " || e.code == "Space" || e.keyCode == 32) {
      location.reload()
    }
  };

  //Function to play the exact file format
  function bumpAudio() {
    var audio = new Audio("static/bump.wav");
    audio.play();
  }

  function loadBeadImages() {
    drawing_green_bead = new Image();
    drawing_white_bead = new Image();
    drawing_green_light_bead = new Image();
    drawing_white_light_bead = new Image();
    drawing_gray_bead = new Image();
    let hoover_bead_image = "static/bead_d_3.png";
    let green_bead_image = "static/bead_d_1.png";
    let white_bead_image = "static/bead_d_2.png";
    let green_light_bead_image = "static/bead_dl_1.png";
    let white_light_bead_image = "static/bead_dl_2.png";

    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
    let bead_no = params.bead; // "some_value"
    if (bead_no === "1") {
      //dimond
      hoover_bead_image = "static/bead_d_3.png";
      green_bead_image = "static/bead_d_1.png";
      white_bead_image = "static/bead_d_2.png";
    } else if (bead_no === "2") {
      hoover_image = "static/gem_gray.png";
      green_bead_image = "static/gem_green.png";
      white_bead_image = "static/gem_white.png";
    }
    drawing_green_bead.src = green_bead_image;
    drawing_white_bead.src = white_bead_image;
    drawing_gray_bead.src = hoover_bead_image;
    drawing_white_light_bead.src = white_light_bead_image;
    drawing_green_light_bead.src = green_light_bead_image;
  }
  this.init = function () {
    abacusCtrl.init();

    start_flag = 1;
    canvas = document.createElement("canvas");
    if (!canvas) console.log("Abacus error: can not create a canvas element");
    canvas.id = parentDivId + "_Abacus";
    canvas.width = 40 + abacusCtrl.beadLines * abacusCtrl.beadSpacing;
    canvas.height =
      -13 * abacusCtrl.scale +
      (abacusCtrl.beadPerLine + 2) * abacusCtrl.beadHeight; //new update

    document.body.appendChild(canvas);
    var parent = document.getElementById(divId);
    if (!parent)
      console.log(
        "Abacus error: can not find an element with the given name: " + divId
      );
    parent.appendChild(canvas);

    canvas.onmousedown = function (event) {
      canvasMouseDown(event);
    };
    canvas.onmousemove = function (event) {
      canvasMouseMove(event);
    };
    canvas.onmouseup = function (event) {
      canvasMouseUp(event);
    };

    canvas.ontouchstart = function (event) {
      canvasTouchStart(event);
    };
    canvas.ontouchmove = function (event) {
      canvasTouchMove(event);
    };
    canvas.ontouchend = function (event) {
      canvasTouchEnd(event);
    };

    loadBeadImages();

    this.update();
    setTimeout(function () {
      that.update();
    }, 300);
  };

  function drawBead(nodeId, ctx) {
    var nodePosX = abacusCtrl.getBeadPositionX(nodeId);
    var nodePosY = abacusCtrl.getBeadPositionY(nodeId);
    let bead_y_offset = 57; //new update
    bead_y_offset = screen.width < 768 ? 33 : bead_y_offset; //new update
    bead_y_offset = screen.width < 500 ? 25 : bead_y_offset; //new update
    var dn = new UIElement(
      nodePosX,
      nodePosY - bead_y_offset, // new update
      abacusCtrl.beadWidth + 4,
      abacusCtrl.beadHeight,
      0,
      nodeId,
      0,
      0
    );

    drawImageBead(
      ctx,
      dn.x,
      dn.y,
      dn.x2 - dn.x,
      dn.y2 - dn.y,
      15,
      nodeId,
      draggedNow.includes(nodeId)
    );
    // ctx.fillStyle = "rgba(255, 255, 255, 1.0)";

    uiElements.push(dn);
    if (false) {
      ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
      ctx.textAlign = "left";
      ctx.font = "10pt sans-serif";
      ctx.fillText("ID: " + nodeId, dn.x + 4, dn.y2 - 13);
      ctx.lineWidth = 1;
    }
  }

  function drawBeads(ctx) {
    var count = abacusCtrl.getBeadsCount();

    for (var i = 0; i < count; i++) {
      if (!(i > 19 && i < 30) && !(i >= 0 && i < 5) && !(i > 9 && i < 15))
        drawBead(i, ctx);
    }
    // start first right column by 5
    if (start_flag === 1) {
      abacusCtrl.activated(15);
      abacusCtrl.activated(5);
      start_flag = 0;
    }
  }

  this.update = function () {
    canvas.width = canvas.width;

    uiElements.length = 0;
    var ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#000000";
    // ctx.fillStyle = "#FFC470";
    let heightOffset;
    let widthOffset;
    if (screen.width < 500) {
      heightOffset = 15;
      widthOffset = 0;
    } else if (screen.width < 768) {
      heightOffset = 0;
      widthOffset = 0;
    } else {
      heightOffset = -30;
      widthOffset = -30;
    }
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
    let bead_no = params.bead;
    if (bead_no === "1") {
      ctx.fillStyle = "#e0e0e0";
    } else if (bead_no === "2") {
      ctx.fillStyle = "#b4b4b8";
    } else {
      ctx.fillStyle = "#e0e0e0";
    }
    // background color  "#8a8a8a" "#b4b4b8"  //
    // ctx.fillRect(
    //   10 * abacusCtrl.scale,
    //   60 * abacusCtrl.scale,
    //   canvas.width - 40 * scale - widthOffset,
    //   canvas.height - 100 * scale - heightOffset,
    // );

    // draw grid
    if (false) {
      ctx.strokeStyle = "#808080";
      var stepsX = 20.0 - 0.0;
      var stepsY = 20.0 - 0.0;

      var lx = 0 % stepsX;
      var ly = 0 % stepsY;
      var Lx = 0 % (stepsX * 5.0);
      if (Lx < 0.0) Lx += stepsX * 5.0;
      var Ly = 0 % (stepsY * 5.0);
      if (Ly < 0.0) Ly += stepsY * 5.0;

      while (lx < canvas.width) {
        if (Math.abs(Lx - lx) < 0.001) {
          ctx.strokeStyle = "#404040";
          Lx += stepsX * 5.0;
        } else {
          ctx.strokeStyle = "#808080";
        }
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, canvas.height);
        ctx.stroke();
        lx += stepsX;
      }

      while (ly < canvas.height) {
        if (Math.abs(Ly - ly) < 0.001) {
          ctx.strokeStyle = "#404040";
          Ly += stepsY * 5.0;
        } else {
          ctx.strokeStyle = "#808080";
        }
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(canvas.width, ly);
        ctx.stroke();
        ly += stepsY;
      }
    }
    // draw frame
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 10 * abacusCtrl.scale;

    for (var i = 0; i < abacusCtrl.beadLines; i++) {
      var x =
        -(30 * abacusCtrl.scale) +
        abacusCtrl.beadLines * abacusCtrl.beadSpacing -
        i * abacusCtrl.beadSpacing;
      var y =
        23 * abacusCtrl.scale + //new update
        (abacusCtrl.beadPerLine + 2) * abacusCtrl.beadHeight;
      ctx.beginPath();
      const grad = ctx.createLinearGradient(x, 0, x + 10, 0); //new update
      grad.addColorStop(0, "white"); //new update
      grad.addColorStop(0.7, "gray"); //new update
      line_offset = 22 * abacusCtrl.scale; //new update
      line_to_offset = screen.width >= 768 ? 61 : 0;  // new update white line from bottom

      line_offset = screen.width < 768 ? 27 : line_offset; //new update
      line_offset = screen.width < 500 ? 19 : line_offset; //new update
      if (i === 2) {
        ctx.lineWidth = 60 * abacusCtrl.scale;
        line_to_offset = screen.width >= 768 ? 60 : 0;
        line_offset = 21 * abacusCtrl.scale;
        ctx.strokeStyle = "#000000";
      } else {
        ctx.strokeStyle = grad;
        ctx.lineWidth = 12 * abacusCtrl.scale;
      }

      ctx.moveTo(x + 3, line_offset); // new update
      ctx.lineTo(x, y - line_to_offset);
      ctx.stroke();
    }

    ctx.lineWidth = 0.2 * abacusCtrl.scale;

    // draw value
    ctx.fillStyle = "rgba(255, 255, 255, 1.0)";
    ctx.textAlign = "center";
    ctx.font = `${11 * abacusCtrl.scale}pt Seymour One, sans-serif`;
    // ctx.color = "white";
    var textY =
      screen.width > 499 ? 15 * abacusCtrl.scale : 12 * abacusCtrl.scale;
    for (var i = 0; i < abacusCtrl.beadLines; i++) {
      if (i === 2) continue;
      var textX =
        -(30 * abacusCtrl.scale) +
        abacusCtrl.beadLines * abacusCtrl.beadSpacing -
        i * abacusCtrl.beadSpacing;
      var valueSum = 0;
      for (var j = 0; j < abacusCtrl.beadPerLine; j++) {
        var n = i * abacusCtrl.beadPerLine + j;
        if (abacusCtrl.nodes[n].active) {
          valueSum += abacusCtrl.nodes[n].value;
        }
      }
      if (i === 1) {
        ctx.fillText("X", textX + 40 * abacusCtrl.scale, textY);
      }
      var valueSting;
      if (abacusCtrl.type === 0) {
        valueSting = valueSum.toString(10);
      } else {
        valueSting = valueSum.toString(16);
      }

      ctx.fillText(valueSting, textX, textY);
    }
    // draws all nodes
    drawBeads(ctx);
  };

  function draggingHandler(event) {
    const line = Math.floor(dragging / abacusCtrl.beadPerLine);
    const beadInLine = dragging - line * abacusCtrl.beadPerLine;
    let draggingBeads;
    const beadHeight = abacusCtrl.beadHeight;
    const startY = 60 * abacusCtrl.scale;
    const endY = 460 * abacusCtrl.scale;
    let beadMouseY;
    let beadPos;
    let maxBeadY;
    let minBeadY;
    let remainingBeads;

    if (event.offsetY)
      beadMouseY = getMouse(event).y + 15 * abacusCtrl.scale; //new update
    else beadMouseY = getTouch(event).y + 15 * abacusCtrl.scale; //new update
    abacusCtrl.nodes[dragging].position[1] = beadMouseY;

    if (!abacusCtrl.nodes[dragging].active) {
      draggingBeads = abacusCtrl.beadPerLine - beadInLine;
      for (var i = 0; i < draggingBeads; i++) {
        if (!abacusCtrl.nodes[dragging + i].active) {
          draggedNow.push(dragging + i);
          beadPos = beadMouseY - i * beadHeight;

          if (dragging >= 0 && dragging < 20) remainingBeads = 5;
          else {
            remainingBeads = 0;
          }

          maxBeadY =
            endY - i * beadHeight - (beadInLine - remainingBeads) * beadHeight;
          minBeadY = startY + beadHeight * (draggingBeads - 1 - i);

          if (beadPos < maxBeadY && beadPos >= minBeadY) {
            abacusCtrl.nodes[dragging + i].position[1] = beadPos;
          } else if (beadPos >= maxBeadY) {
            abacusCtrl.nodes[dragging + i].position[1] = maxBeadY;
          } else if (beadPos < minBeadY) {
            abacusCtrl.nodes[dragging + i].position[1] = minBeadY;
          }
        }
      }
    } else {
      draggingBeads = beadInLine + 1;
      for (var i = 0; i < draggingBeads; i++) {
        if (abacusCtrl.nodes[dragging - i].active) {
          draggedNow.push(dragging - i);
          beadPos = beadMouseY + i * beadHeight;

          if (dragging >= 0 && dragging < 20)
            remainingBeads = draggingBeads - 6;
          else if (dragging >= 39 && dragging <= 31) {
            remainingBeads = draggingBeads - 2;
          } else remainingBeads = draggingBeads - 1;

          maxBeadY = endY - (remainingBeads - i) * beadHeight; // * (draggingBeads - 1 - i);
          minBeadY =
            startY + i * beadHeight + (10 - draggingBeads) * beadHeight;
          if (beadPos < maxBeadY && beadPos >= minBeadY) {
            abacusCtrl.nodes[dragging - i].position[1] = beadPos;
          } else if (beadPos >= maxBeadY) {
            abacusCtrl.nodes[dragging - i].position[1] = maxBeadY;
          } else if (beadPos < minBeadY) {
            abacusCtrl.nodes[dragging - i].position[1] = minBeadY;
          }
        }
      }
    }
  }

  function storeOriginalY() {
    line = Math.floor(dragging / abacusCtrl.beadPerLine);
    beadInLine = dragging - line * abacusCtrl.beadPerLine;
    originalY = {};
    originalY[dragging] = abacusCtrl.nodes[dragging].position[1];
    if (!abacusCtrl.nodes[dragging].active) {
      for (var i = 0; i < abacusCtrl.beadPerLine - beadInLine; i++)
        originalY[dragging + i] = abacusCtrl.nodes[dragging + i].position[1];
    } else {
      for (var i = 0; i < beadInLine + 1; i++)
        originalY[dragging - i] = abacusCtrl.nodes[dragging - i].position[1];
    }
  }

  function restorOriginalY() {
    line = Math.floor(dragging / abacusCtrl.beadPerLine);
    beadInLine = dragging - line * abacusCtrl.beadPerLine;
    if (
      abacusCtrl.nodes[dragging] &&
      abacusCtrl.nodes[dragging].position[1] === originalY[dragging]
    ) {
      return 0;
    }
    if (abacusCtrl.nodes[dragging]) {
      abacusCtrl.nodes[dragging].position[1] = originalY[dragging];
      if (!abacusCtrl.nodes[dragging].active) {
        for (var i = 0; i < abacusCtrl.beadPerLine - beadInLine; i++)
          abacusCtrl.nodes[dragging + i].position[1] = originalY[dragging + i];
      } else {
        for (var i = 0; i < beadInLine + 1; i++)
          abacusCtrl.nodes[dragging - i].position[1] = originalY[dragging - i];
      }
    }
    return 1;
  }
  function mouseOverElement(pos) {
    var selectedElement = -1;
    for (var n in uiElements) {
      if (uiElements[n].type !== 2) {
        // not of type "connection"
        if (
          uiElements[n].x - 1 < pos.x &&
          uiElements[n].x2 + 1 > pos.x &&
          uiElements[n].y - 1 < pos.y &&
          uiElements[n].y2 + 1 > pos.y
        ) {
          selectedElement = n;
        }
      }
    }
    return selectedElement;
  }

  function canvasMouseDown(event) {
    var pos = getMouse(event);

    // handle selection
    if (!event.altKey && event.which === 1) {
      var selectedElement = mouseOverElement(pos);
      hooveredBead = -1;

      window.addEventListener("mouseup", function (windowMouseUpEvent) {
        // Check if the mouse was previously pressed down on the canvas and mouse up outsite the canvas
        if (windowMouseUpEvent.target.tagName !== "CANVAS") {
          canvasMouseUp(event);
        }
        window.removeEventListener("mouseup", this);
      });
      if (selectedElement !== -1) {
        // handle node selection

        if (uiElements[selectedElement].type === 0) {
          var newSelectedBead = uiElements[selectedElement].ref;
          // hooveredBead = newSelectedBead;
          dragging = newSelectedBead;
          storeOriginalY();
        }
      }
    }
    event.preventDefault();
  }

  function canvasMouseUp(event) {
    var pos = getMouse(event);
    const dont_touch_move = restorOriginalY();

    if (!event.altKey && event.which === 1) {
      if (dragging !== -1 && dragging !== 30 && dont_touch_move)
        abacusCtrl.activated(dragging);
      draggedNow = [];

      that.update();
      dragging = -1;
    }
    event.preventDefault();
  }

  function canvasMouseMove(event) {
    var pos = getMouse(event);

    hooveredElement = mouseOverElement(pos);
    if (dragging !== -1 && dragging !== 30) {
      draggingHandler(event);

      that.update();
    }
    event.preventDefault();
  }

  function canvasTouchStart(event) {
    touchPos = getTouch(event);

    // handle selection
    if (!event.altKey && event.touches.length === 1) {
      var selectedElement = mouseOverElement(touchPos);

      if (selectedElement !== -1) {
        // handle node selection
        if (uiElements[selectedElement].type === 0) {
          var newSelectedBead = uiElements[selectedElement].ref;
          dragging = newSelectedBead;
          storeOriginalY();
        }
      }
    }
    event.preventDefault();
  }

  function canvasTouchEnd(event) {
    const dont_touch_move = restorOriginalY();

    if (!event.altKey && event.touches.length === 0) {
      if (dragging !== -1 && dragging !== 30 && dont_touch_move) abacusCtrl.activated(dragging);
      draggedNow = [];
      that.update();
      dragging = -1;
    }
    event.preventDefault();
  }

  function canvasTouchMove(event) {
    // debugger;
    touchPos = getTouch(event);
    hooveredElement = mouseOverElement(touchPos);
    if (dragging !== -1 && dragging !== 30) {
      draggingHandler(event);
      that.update();
    }
    event.preventDefault();
  }

  function getTouch(e) {
    var element = canvas;
    var offsetX = 0,
      offsetY = 0,
      mx,
      my;

    // compute the total offset
    if (element.offsetParent !== undefined) {
      do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while ((element = element.offsetParent));
    }
    if (e.touches[0]) {
      mx = e.touches[0].pageX - offsetX;
      my = e.touches[0].pageY - offsetY;
    }

    return { x: mx, y: my };
  }

  function getMouse(e) {
    var element = canvas;
    var offsetX = 0,
      offsetY = 0,
      mx,
      my;

    // compute the total offset
    if (element.offsetParent !== undefined) {
      do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while ((element = element.offsetParent));
    }

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;

    return { x: mx, y: my };
  }

  function drawImageBead(ctx, x, y, width, height, radius, nodeId, hoover) {
    if (nodeId >= 31 && nodeId <= 39)
      ctx.drawImage(drawing_white_bead, x, y, width, height);
    else ctx.drawImage(drawing_green_bead, x, y, width, height);
    if (nodeId === 45)
      ctx.drawImage(drawing_green_light_bead, x, y, width, height);
    if (nodeId === 35)
      ctx.drawImage(drawing_white_light_bead, x, y, width, height);
    if (nodeId === 30 || hoover)
      ctx.drawImage(drawing_gray_bead, x, y, width, height);
  }
}

// Generate a random password
function generatePassword(length) {
  const charset = "abcdefghijklmnopqrstuvwxy0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const messageElement = document.getElementById("login-message");
let code;

loginForm &&
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission

    const username = usernameInput.value;
    const password = passwordInput.value;

    // Replace with your validation logic
    if (username === "student" && password === (await getPassword())) {
      code = generatePassword(12);
      localStorage.setItem("code", code);
      window.location.href = `index.html?flag=${code}`;
    } else {
      messageElement.textContent = "The Username or Password is Incorrect";
    }
  });
async function getCode() {
  try {
    const response = await fetch("./data.json");
    const json = await response.json();
    return json.code;
  } catch (error) {
    console.error("Error reading password:", error);
    // Handle the error here, maybe return a default value
  }
}

async function getPassword() {
  try {
    const response = await fetch("./data.json");
    const json = await response.json();
    return json.password;
  } catch (error) {
    console.error("Error reading password:", error);
    // Handle the error here, maybe return a default value
  }
}

