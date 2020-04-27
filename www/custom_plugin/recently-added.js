class UpcomingMediaCard extends HTMLElement {
  set hass(hass) {
    if (!this.content) {
      this.content = document.createElement("div");
      this.content.style="display: flex"
      this.appendChild(this.content);
    }

    const entity = this.config.entity;
    if (!hass.states[entity]) return;
    const json = JSON.parse(hass.states[entity].attributes.data);
    if (!json[1] && this.config.hide_empty) this.style.display = "none";
    if (!json || !json[1] || this.prev_json == JSON.stringify(json)) return;
    this.prev_json = JSON.stringify(json);
    const title_text = this.config.title_text || json[0]["title_default"];
    const line1_text = this.config.line1_text || json[0]["line1_default"];
    const line2_text = this.config.line2_text || json[0]["line2_default"];
    const line3_text = this.config.line3_text || json[0]["line3_default"];
    const line4_text = this.config.line4_text || json[0]["line4_default"];
    const title_size = this.config.title_size || "large";
    const line1_size =
      this.config.line1_size || this.config.line_size || "medium";
    const line2_size =
      this.config.line2_size || this.config.line_size || "small";
    const line3_size =
      this.config.line3_size || this.config.line_size || "small";
    const line4_size =
      this.config.line4_size || this.config.line_size || "small";
    const tSize = size =>
      size == "large" ? "18" : size == "medium" ? "14" : "12";
    const size = [
      tSize(title_size),
      tSize(line1_size),
      tSize(line2_size),
      tSize(line3_size),
      tSize(line4_size)
    ];
    const max = Math.min(json.length - 1, this.config.max || 5);
    window.cardSize = max;

    let style = document.createElement("style");
    style.setAttribute("id", "umc_style");
    style.textContent = `
      .rece_poster {
        width:100%;
        margin-left: auto;
        margin-right: auto;
        position: relative;
        overflow: hidden;
      }
      .rece_poster img {
        width:100%;
        visibility:hidden;
      }
      .rece_container_poster {
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
      }
      .rece_line0_poster {
        font-size: 12px;
        text-shadow: 1px 1px 3px rgba(0,0,0,0.9);
        fill: #fff;
        display: block;
        text-align: center;
        text-shadow: 0px 0px 5px #000000;
        color: rgba(255,255,255,1);
      }
      .rece_line3_poster {
        font-size: 12px;
        text-shadow:1px 1px 3px rgba(0,0,0,0.9);
        fill: #fff;
        display: block;
        text-align: center;
        text-shadow: 0px 0px 5px #000000;
        color: rgba(255,255,255,1);
      }
    `;
    this.content.innerHTML = "";
    
    function truncate(text, chars) {
      // When to truncate depending on size
      chars = chars == "large" ? 23 : chars == "medium" ? 28 : 35;
      // Remove parentheses & contents: "Shameless (US)" becomes "Shameless".
      text = text.replace(/ *\([^)]*\) */g, " ");
      return text;
    }

    const position = this.config.position;
    for (let count = 1; count <= max; count++) {
      if (position && count != position) continue;
      const item = key => json[count][key];
      if (!item("airdate")) continue;
      let image = item("poster");

      // Format runtime as either '23 min' or '01:23' if over an hour
      let hrs = String(Math.floor(item("runtime") / 60)).padStart(2, 0);
      let min = String(Math.floor(item("runtime") % 60)).padStart(2, 0);
      let runtime =
        item("runtime") > 0 ? (hrs > 0 ? `${hrs}:${min}` : `${min} min`) : "";
      
      let line = [title_text, line1_text, line2_text, line3_text, line4_text];
      let char = [title_size, line1_size, line2_size, line3_size, line4_size];

      // Keyword map for replacement, return null if empty so we can hide empty sections
      let keywords = /\$title|\$episode|\$number|\$rating|\$runtime/g;
      let keys = {
        $title: item("title") || null,
        $episode: item("episode") || null,
        $number: item("number") || null,
        $rating: item("rating") || null,
        $runtime: runtime || null
      };

      // Replace keywords in lines
      for (let i = 0; i < line.length; i++) {
        line[i] = line[i].replace(" - ", "-");
        
        // Split at '-' so we can ignore entire contents if keyword returns null
        let text = line[i].replace(keywords, val => keys[val]).split("-");
        let filtered = [];

        // Rebuild lines, ignoring null
        for (let t = 0; t < text.length; t++) {
          if (text[t].match(null)) continue;
          else filtered.push(text[t]);
        }

        // Replacing twice to get keywords in component generated strings
        text = filtered.join(" - ").replace(keywords, val => keys[val]);

        // Shifting header text around depending on view & size
        let y;
        if (i == 0)
          size[i].match(/18/)
            ? (y = "-5")
            : size[i].match(/14/)
            ? (y = "-2")
            : (y = "0");
        let svgshift = i == 0 ? `x="15" y="${y}" dy="1.3em" ` : `x="15" dy="1.3em" `;

        // Build lines HTML or empty line
        line[i] = line[i].match("empty")
          ? `<tspan class="rece_line${i}_poster" style="display:block;fill:transparent;text-shadow:0 0 transparent;" ${svgshift}>.</tspan>`
          : `<tspan class="rece_line${i}_poster" ${svgshift}>${truncate(text,char[i])}</tspan>`;
      }
      
      this.content.innerHTML += `
        <ha-card style="box-shadow:none;margin-left: 0px;margin-right: 0px;">
          <div class='rece_poster'>
            <div class="rece_container_poster" style="background-image:url('${image}');">
              <img src="${image}"/>
            </div>
            <text style="position: absolute;padding: 4px 0px 0px 0px;height: 100%;width: 100%;top: 0px;left: 0px;background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.2) 30%, rgba(0, 0, 0, 0) 50%);border-radius:10px;">
              ${line[0]}
              ${line[3]}
            </text>
          </div>
        </<ha-card>
      `;
      if (!this.querySelector('[id="umc_style"]')) this.appendChild(style);
    }
  }
  setConfig(config) {
    if (!config.service && !config.entity)
      throw new Error("Define entity.");
    this.config = config;
  }
  getCardSize() {
    return window.cardSize * 5;
  }
}
customElements.define("upcoming-media-card", UpcomingMediaCard);
