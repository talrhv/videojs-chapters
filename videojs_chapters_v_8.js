/*!
 * @viostream/videojs-chapters v0.0.18 (Video.js 8 compatible)
 * https://github.com/Viostream/videojs-chapters
 *
 * Updated by ChatGPT (July 2025)
 * Released under the MIT License
 */

import videojs from 'video.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const { obj: { merge } } = videojs;
const Component = videojs.getComponent('Component');
const Plugin    = videojs.getPlugin('plugin');
const dom       = videojs.dom;

/**
 * Injects (or updates) a <style> element with the given id + CSS contents.
 * @param {string} id
 * @param {string} cssText
 */
function injectStyle(id, cssText) {
  let style = document.getElementById(id);
  if (style) {
    style.textContent = cssText;
  } else {
    style = document.createElement('style');
    style.id = id;
    style.textContent = cssText;
    document.head.append(style);
  }
}

// ---------------------------------------------------------------------------
// Chapter ‑ Progress‑Bar marker
// ---------------------------------------------------------------------------

/**
 * A single marker that sits on top of the native progress bar at a specific
 * percentage of the duration, with optional tooltip label.
 */
class ChapterMarker extends Component {
  /** @param {{ time:number, label:string }} options */
  constructor(player, options) {
    super(player, options);
    this.updatePosition();
    this.on(player, 'durationchange', () => this.updatePosition());
  }

  /** @override */
  createEl() {
    return dom.createEl('div', {
      className: 'vjs-chapter-marker',
      title:     this.options_.label || ''
    }, {},
    // children
    [dom.createEl('span', {
      className: 'vjs-chapter-tooltip',
      innerHTML: this.options_.label || ''
    })]);
  }

  /** Updates CSS left% based on chapter time vs. duration. */
  updatePosition() {
    const dur = this.player().duration() || 1;
    const pct = (this.options_.time / dur) * 100;
    this.el().style.left = pct + '%';
  }
}

/**
 * Control overlay that draws multiple ChapterMarker children above the
 * progress bar (position: absolute; top: 0 within control‑bar).
 */
class ChapterMarkersProgressBarControl extends Component {
  constructor(player, options) {
    super(player, options);
    this.markers = [];
    this.buildMarkers();
  }

  /** @override */
  createEl() {
    return dom.createEl('div', { className: 'vjs-chapter-markers-container' });
  }

  buildMarkers() {
    const chapters = this.options_.chapters || [];
    chapters.forEach(ch => {
      const marker = new ChapterMarker(this.player_, ch);
      this.addChild(marker);
      marker.el().addEventListener('click', () => {
        this.player_.currentTime(ch.time);
        this.player_.play();
      });
      this.markers.push(marker);
    });
  }
}

// ---------------------------------------------------------------------------
// Chapter ‑ Horizontal navigation bar
// ---------------------------------------------------------------------------

class ChapterHorizontalControl extends Component {
  constructor(player, options) {
    super(player, options);
    this.buildList();
    this.on(player, 'timeupdate', () => this.highlight());
  }

  /** @override */
  createEl() {
    return dom.createEl('div', { className: 'vjs-chapter-horizontal-container' });
  }

  buildList() {
    const list = dom.createEl('ul', { className: 'vjs-chapter-horizontal-list' });
    (this.options_.chapters || []).forEach((ch, idx) => {
      const li = dom.createEl('li', {
        className: 'vjs-chapter-item',
        innerHTML: ch.label
      });
      li.dataset.index = idx;
      li.addEventListener('click', () => {
        this.player_.currentTime(ch.time);
        this.player_.play();
      });
      list.append(li);
    });
    this.el().append(list);
  }

  highlight() {
    const time = this.player_.currentTime();
    const chapters = this.options_.chapters || [];
    let current = -1;
    for (let i = 0; i < chapters.length; i++) {
      if (time >= chapters[i].time) current = i; else break;
    }

    this.el().querySelectorAll('.vjs-chapter-item').forEach(li => {
      li.classList.toggle('vjs-current', parseInt(li.dataset.index, 10) === current);
    });
  }
}

// ---------------------------------------------------------------------------
// Chapter ‑ Dropdown control
// ---------------------------------------------------------------------------

class ChapterDropdownControl extends Component {
  constructor(player, options) {
    super(player, options);
    this.buildSelect();
  }

  /** @override */
  createEl() {
    return dom.createEl('div', { className: 'vjs-chapter-dropdown-container' });
  }

  buildSelect() {
    const select = dom.createEl('select', {
      className:  'vjs-chapter-select',
      ariaLabel:  'Chapters'
    });

    (this.options_.chapters || []).forEach(ch => {
      select.append(dom.createEl('option', {
        value:     ch.time,
        innerHTML: ch.label
      }));
    });

    select.addEventListener('change', e => {
      this.player_.currentTime(parseFloat(e.target.value));
      this.player_.play();
    });

    this.el().append(select);
  }
}

// ---------------------------------------------------------------------------
// Main Plugin wrapper
// ---------------------------------------------------------------------------

class Chapters extends Plugin {
  constructor(player, options) {
    super(player, options);

    this.options = merge({
      chapterType: 'horizontal',  // 'horizontal' | 'dropdown' | 'progressbar'
      chapters:    [],            // [{ label, time }]
      styles:      {}             // optional CSS overrides
    }, options);

    // Add base class to player for custom styling.
    player.ready(() => player.addClass('vjs-has-chapters'));

    player.one('loadedmetadata', () => {
      if (!this.options.chapters.length) return;

      let control;
      switch ((this.options.chapterType || '').toLowerCase()) {
        case 'dropdown':
          control = new ChapterDropdownControl(player, this.options);
          break;
        case 'progressbar':
          control = new ChapterMarkersProgressBarControl(player, this.options);
          break;
        default:
          control = new ChapterHorizontalControl(player, this.options);
      }

      // Overlay: insert just after the player element in DOM so that it sits
      // outside the control bar but inside the player wrapper.
      player.addChild(control);
    });

    // ---------------------------------------------------------------------
    // Default theme (can be overridden via external CSS or this.options.styles)
    // ---------------------------------------------------------------------

    injectStyle('vjs-chapters-style', `
      .vjs-has-chapters .vjs-chapter-marker              {position:absolute;top:0;width:2px;height:100%;background:#2196f3;cursor:pointer;}
      .vjs-has-chapters .vjs-chapter-marker:hover        {background:#64b5f6;}
      .vjs-has-chapters .vjs-chapter-tooltip             {display:none;position:absolute;bottom:100%;left:-50%;transform:translateX(50%);background:#2196f3;color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;white-space:nowrap;}
      .vjs-has-chapters .vjs-chapter-marker:hover .vjs-chapter-tooltip{display:block;}
      .vjs-chapter-horizontal-container                 {display:flex;justify-content:center;margin-top:6px;}
      .vjs-chapter-horizontal-list                      {list-style:none;display:flex;gap:8px;margin:0;padding:0;}
      .vjs-chapter-item                                 {cursor:pointer;padding:3px 8px;font-size:13px;border-radius:4px;}
      .vjs-chapter-item.vjs-current                     {background:#2196f3;color:#fff;font-weight:600;}
      .vjs-chapter-dropdown-container select            {padding:3px 6px;font-size:13px;}
    `);
  }
}

Chapters.VERSION = '0.0.18';

// Register the plugin with Video.js (v7 & v8).
videojs.registerPlugin('chapters', Chapters);

export default Chapters;
