/*! @name @viostream/videojs-chapters @version v8.0.0 @license MIT */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('video.js')) :
  typeof define === 'function' && define.amd ? define(['video.js'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.videojsChapters = factory(global.videojs));
}(this, (function (videojs) { 'use strict';

  const version = "v8.0.0";

  const ChapterIcon = function(container) {
    const icon = document.createElement('div');
    icon.className = "vjs-viostream-chapters-icon";
    icon.setAttribute("title", "Chapters");
    icon.setAttribute("aria-label", "Chapters");
    container.appendChild(icon);
  };

  const StyleManager = {
    WriteStyles: function(playerId, rules) {
      const css = rules.join(' ');
      const styleId = playerId + '-styles';
      if (!css) return;
      let style = document.querySelector("#" + styleId);

      if (style !== null) {
        style.parentNode.removeChild(style);
      }

      if (style === null) {
        style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.id = styleId;
      }

      style.append(document.createTextNode(css));
      document.head.append(style);
    },
    GenerateStyle: function(container, property, value) {
      return "#" + container + " " + property + " { " + value + " }";
    }
  };

  // Get Component class from Video.js 8
  const Component = videojs.getComponent('Component');

  /**
   * The class for chapter dropdown list
   * @extends Component
   */
  class ChapterDropdownControl extends Component {
    /**
     * Constructor for class
     * @param {Player|Object} player The player
     * @param {options|Object} options player options
     */
    constructor(player, options) {
      super(player, options);
      
      const playerContainer = player.el();
      this.cssRules = [];
      this.settings = {
        skin: {
          background: '#1a1a1a',
          color: '#ffffff'
        }
      };

      if (options.styles) {
        this.settings.skin = options.styles;
      }

      this.containerId = player.id() + "-vjs-viostream-chaptering-container";
      this.generateStyles();

      const chapteringContainer = document.createElement('div');
      chapteringContainer.id = this.containerId;
      chapteringContainer.className = 'vjs-viostream-chaptering-container vjs-viostream-chaptering-container-dropdown';
      chapteringContainer.setAttribute('data-chapter-mode', 'dropdown');
      ChapterIcon(chapteringContainer);
      
      const selectList = document.createElement('select');
      selectList.className = 'vjs-viostream-chaptering-dropdown';
      selectList.onchange = null;
      chapteringContainer.appendChild(selectList);
      playerContainer.parentNode.insertBefore(chapteringContainer, playerContainer.nextSibling);
      
      const chapterTimeArray = [];

      if (options.chapters === undefined) {
        options.chapters = [];
      }

      const videoDuration = player.duration();

      for (let j = 0; j < options.chapters.length; j++) {
        if (options.chapters[j].time < 0 || options.chapters[j].time > videoDuration) {
          continue;
        }

        chapterTimeArray.push(options.chapters[j].time);
        const option = document.createElement('option');
        option.value = options.chapters[j].time;
        option.text = options.chapters[j].label;
        selectList.appendChild(option);
      }

      selectList.selectedIndex = 0;
      selectList.onchange = function(event) {
        ChapterDropdownControl.changeEventHandler(player, event);
      };

      ChapterDropdownControl.onChapterProgressForDropdown(player, selectList, chapterTimeArray);
    }

    generateStyles() {
      const cssRules = [
        StyleManager.GenerateStyle(this.containerId, "", "background-color:" + this.settings.skin.background),
        StyleManager.GenerateStyle(this.containerId, "", "color:" + this.settings.skin.color)
      ];
      StyleManager.WriteStyles(this.containerId, cssRules);
    }

    static changeEventHandler(player, event) {
      const time = event.target.value;
      player.currentTime(time);
      player.play();
    }

    static onChapterProgressForDropdown(player, chapterSelectList, chapterTimeArray) {
      player.on('timeupdate', function(e) {
        const seconds = this.currentTime();

        if (chapterTimeArray.length === 0 || seconds < chapterTimeArray[0]) {
          return;
        }

        for (let c = chapterTimeArray.length; c > 0; c--) {
          if (seconds >= chapterTimeArray[c - 1]) {
            if (chapterSelectList.selectedIndex !== c - 1) {
              chapterSelectList.selectedIndex = c - 1;
            }
            break;
          }
        }
      });
    }
  }

  videojs.registerComponent('ChapterDropdownControl', ChapterDropdownControl);

  /**
   * The class for chapter horizontal control
   * @extends Component
   */
  class ChapterHorizontalControl extends Component {
    constructor(player, options) {
      super(player, options);
      
      const playerContainer = player.el();
      this.settings = {
        skin: {
          background: '#1a1a1a',
          color: '#fff',
          backgroundActive: '#272727',
          colorActive: '#fff'
        }
      };

      if (options.styles) {
        this.settings.skin = options.styles;
      }

      this.containerId = player.id() + "-vjs-viostream-chaptering-container";
      this.generateStyles();

      const chapteringContainer = document.createElement('div');
      chapteringContainer.id = this.containerId;
      chapteringContainer.className = 'vjs-viostream-chaptering-container v-hide vjs-viostream-chaptering-horizontal';
      chapteringContainer.setAttribute('data-chapter-mode', 'horizontal');
      ChapterIcon(chapteringContainer);
      
      const chapteringOuterStageContainer = document.createElement('div');
      chapteringOuterStageContainer.className = 'vjs-viostream-outer-stage';
      
      const chapteringItemList = document.createElement('div');
      chapteringItemList.className = 'vjs-viostream-chapter-item-list';
      
      const leftArrowButton = document.createElement('button');
      leftArrowButton.className = 'vjs-viostream-chaptering-arrow-button vjs-viostream-chaptering-left';
      leftArrowButton.title = 'Show earlier chapters';
      
      const leftArrowIcon = document.createElement('i');
      leftArrowIcon.className = 'vjs-viostream-chaptering-arrow-button-left-sign vjs-viostream-chaptering-arrow-button-icon';
      
      const rightArrowButton = document.createElement('button');
      rightArrowButton.className = 'vjs-viostream-chaptering-arrow-button vjs-viostream-chaptering-right';
      rightArrowButton.title = 'Show later chapters';
      
      const rightArrowIcon = document.createElement('i');
      rightArrowIcon.className = 'vjs-viostream-chaptering-arrow-button-right-sign vjs-viostream-chaptering-arrow-button-icon';

      leftArrowButton.onclick = function() {
        leftArrowButton.focus();
        ChapterHorizontalControl.scrollLeft(chapteringItemList);
        return false;
      };

      rightArrowButton.onclick = function() {
        rightArrowButton.focus();
        ChapterHorizontalControl.scrollRight(chapteringItemList);
        return false;
      };

      leftArrowButton.appendChild(leftArrowIcon);
      chapteringContainer.appendChild(leftArrowButton);
      rightArrowButton.appendChild(rightArrowIcon);
      chapteringContainer.appendChild(rightArrowButton);
      chapteringOuterStageContainer.appendChild(chapteringItemList);
      chapteringContainer.appendChild(chapteringOuterStageContainer);
      playerContainer.parentNode.insertBefore(chapteringContainer, playerContainer.nextSibling);

      if (options.chapters === undefined) {
        options.chapters = [];
      }

      player.ready(() => {
        ChapterHorizontalControl.addChapters(player, options.chapters);
        ChapterHorizontalControl.resize(chapteringContainer);
      });
    }

    generateStyles() {
      const skin = this.settings.skin;
      const cssRules = [
        StyleManager.GenerateStyle(this.containerId, "", "background-color:" + this.settings.skin.background + "; color:" + this.settings.skin.color),
        StyleManager.GenerateStyle(this.containerId, '.vjs-viostream-chaptering-arrow-button', "background-color:" + skin.background),
        StyleManager.GenerateStyle(this.containerId, '.vjs-viostream-chaptering-arrow-button-icon', "border-color:" + skin.color),
        StyleManager.GenerateStyle(this.containerId, '.vjs-viostream-chaptering-arrow-button-icon:hover', "border-color:" + skin.colorActive),
        StyleManager.GenerateStyle(this.containerId, '.vjs-viostream-chapter-item', "background-color:" + skin.background + ";color:" + skin.color),
        StyleManager.GenerateStyle(this.containerId, '.vjs-viostream-chapter-item:hover', "background-color:" + skin.backgroundActive + ";color:" + skin.colorActive),
        StyleManager.GenerateStyle(this.containerId, '.vjs-viostream-chapter-item:active, .vjs-viostream-chapter-item:focus', "outline-color:" + skin.colorActive + ";"),
        StyleManager.GenerateStyle(this.containerId, '.vjs-viostream-chapter-item.vjs-viostream-chapter-item-active', "background-color:" + skin.backgroundActive + ";color:" + skin.colorActive)
      ];
      StyleManager.WriteStyles(this.containerId, cssRules);
    }

    static minChapterItemWidth() {
      return 220;
    }

    static addChapters(player, chapters) {
      const containerId = player.id() + "-vjs-viostream-chaptering-container";
      const chapterContainer = document.querySelector("#" + containerId);

      if (chapterContainer === null) {
        return;
      }

      const chapterTimeArray = [];
      const chapteringItemList = chapterContainer.querySelector('.vjs-viostream-chapter-item-list');

      if (chapters === null) {
        ChapterHorizontalControl.addClass(chapterContainer, 'v-hide');
        return;
      }

      const containerWidth = player.currentWidth();
      let chapterDisplayNumber = Math.floor(containerWidth / ChapterHorizontalControl.minChapterItemWidth());

      if (chapterDisplayNumber < 1) {
        chapterDisplayNumber = 1;
      }

      chapteringItemList.style.left = '0px';
      chapteringItemList.setAttribute('data-chapter-item-display', chapterDisplayNumber);
      chapteringItemList.setAttribute('data-chapter-length', chapters.length);
      chapteringItemList.setAttribute('data-chapter-selected', 0);
      chapteringItemList.setAttribute('data-chapter-step-index', 0);
      chapteringItemList.setAttribute('data-chapter-scroll-index', 0);
      chapteringItemList.setAttribute('data-chapter-max-scroll-index', chapters.length - chapterDisplayNumber);
      chapteringItemList.innerHTML = '';
      
      const videoDuration = player.duration();

      for (let i = 0; i < chapters.length; i++) {
        if (chapters[i].time < 0 || chapters[i].time > videoDuration) {
          continue;
        }

        chapterTimeArray.push(chapters[i].time);
        const ariaLabelText = chapters[i].label.replace(/\"/ig, '&quot;');
        const chapterButton = document.createElement('button');
        chapterButton.className = 'vjs-viostream-chapter-item';
        chapterButton.setAttribute('data-time', chapters[i].time);
        chapterButton.setAttribute('data-chapter-index', i + 1);
        chapterButton.setAttribute('aria-label', ariaLabelText);
        
        const chapterButtonSpan = document.createElement('span');
        chapterButtonSpan.innerHTML = chapters[i].label;
        chapterButton.appendChild(chapterButtonSpan);

        chapterButton.onclick = function(e) {
          ChapterHorizontalControl.selectChapterEvent(player, e, chapteringItemList);
          return false;
        };

        chapteringItemList.appendChild(chapterButton);
      }

      if (chapters.length > 0) {
        ChapterHorizontalControl.onChapterProgressForHorizontal(player, chapteringItemList, chapterTimeArray);
      }

      ChapterHorizontalControl.removeClass(chapterContainer, 'v-hide');
    }

    static onChapterProgressForHorizontal(player, chapterItemList, chapterTimeArray) {
      player.on('timeupdate', function(e) {
        const seconds = this.currentTime();

        if (seconds < chapterTimeArray[0]) {
          chapterItemList.setAttribute('data-chapter-selected', 0);
          return;
        }

        const chaptersSmallEnough = chapterTimeArray.filter(sec => sec <= seconds);

        if (chaptersSmallEnough.length > 0) {
          const matchingChapterTime = chaptersSmallEnough[chaptersSmallEnough.length - 1];
          const newChapter = chapterTimeArray.indexOf(matchingChapterTime) + 1;
          const currentChapter = parseInt(chapterItemList.getAttribute('data-chapter-selected'), 10);

          if (currentChapter > 1) {
            const chapterStepIndex = parseInt(chapterItemList.getAttribute('data-chapter-scroll-index'), 10);
            const maxStepIndex = parseInt(chapterItemList.getAttribute('data-chapter-max-scroll-index'), 10);
            const newStepIndex = chapterStepIndex === maxStepIndex ? chapterStepIndex : chapterStepIndex + 1;
            chapterItemList.setAttribute('data-chapter-scroll-index', newStepIndex);
          } else {
            chapterItemList.setAttribute('data-chapter-scroll-index', 0);
          }

          if (newChapter !== currentChapter) {
            chapterItemList.setAttribute('data-chapter-selected', newChapter);
            ChapterHorizontalControl.clearSelectedStyle(chapterItemList);
            const el = chapterItemList.querySelectorAll('.vjs-viostream-chapter-item')[newChapter - 1];
            ChapterHorizontalControl.addClass(el, 'vjs-viostream-chapter-item-active');
            ChapterHorizontalControl.scrollChapterItemList(el, chapterItemList);
          }
        }
      });
    }

    static scrollChapterItemList(chapterItem, chapteringItemList) {
      if (chapterItem === null || ChapterHorizontalControl.hasClass(chapteringItemList.parentNode.parentNode, 'vjs-viostream-chaptering-noscroll')) {
        return;
      }

      const newStepIndex = parseInt(chapterItem.getAttribute('data-chapter-index'), 10) - 1;
      const newLeftOffset = chapterItem.clientWidth * -newStepIndex;
      const itemWidth = chapterItem.clientWidth;
      const itemsDisplayed = parseInt(chapteringItemList.getAttribute('data-chapter-item-display'), 10);
      const rightStop = -(parseInt(chapteringItemList.clientWidth, 10) - itemWidth * itemsDisplayed);
      chapteringItemList.setAttribute('data-chapter-step-index', newStepIndex);
      chapteringItemList.scrollLeft = 0;
      chapteringItemList.parentNode.scrollLeft = 0;
      chapteringItemList.style.left = Math.max(newLeftOffset, rightStop) + 'px';
    }

    static selectChapterEvent(player, event, chapterContainer) {
      let target = event.target;

      if (event.target.tagName === 'SPAN') {
        target = event.target.parentElement;
      }

      const time = target.getAttribute('data-time');
      player.currentTime(time);
      player.play();
    }

    static scrollLeft(chapteringItemList) {
      const chapterStepIndex = parseInt(chapteringItemList.getAttribute('data-chapter-scroll-index'), 10);
      const newStepIndex = chapterStepIndex === 0 ? 0 : chapterStepIndex - 1;
      chapteringItemList.setAttribute('data-chapter-scroll-index', newStepIndex);
      const leftStep = parseInt(chapteringItemList.style.left, 10) + parseInt(chapteringItemList.getAttribute('data-chapter-item-width'), 10);
      chapteringItemList.style.left = Math.min(leftStep, 0) + 'px';
    }

    static scrollRight(chapteringItemList) {
      const itemWidth = parseInt(chapteringItemList.getAttribute('data-chapter-item-width'), 10);
      const itemsDisplayed = parseInt(chapteringItemList.getAttribute('data-chapter-item-display'), 10);
      const rightStep = parseInt(chapteringItemList.style.left, 10) - itemWidth;
      const rightStop = -(chapteringItemList.clientWidth - itemWidth * itemsDisplayed);
      const chapterStepIndex = parseInt(chapteringItemList.getAttribute('data-chapter-scroll-index'), 10);
      const maxStepIndex = parseInt(chapteringItemList.getAttribute('data-chapter-max-scroll-index'), 10);
      const newStepIndex = chapterStepIndex === maxStepIndex ? chapterStepIndex : chapterStepIndex + 1;
      chapteringItemList.setAttribute('data-chapter-scroll-index', newStepIndex);
      chapteringItemList.style.left = Math.max(rightStep, rightStop) + 'px';
    }

    static clearSelectedStyle(itemListContainer) {
      const elc = itemListContainer.querySelectorAll('.vjs-viostream-chapter-item');
      for (let i = 0; i < elc.length; i++) {
        ChapterHorizontalControl.removeClass(elc[i], 'vjs-viostream-chapter-item-active');
      }
    }

    static resize(chapterContainer, responsive) {
      const chapteringItemList = chapterContainer.querySelector('.vjs-viostream-chapter-item-list');
      chapteringItemList.style.width = null;
      const innerWidth = chapteringItemList.parentNode.offsetWidth;
      let chapterDisplayNumber = Math.floor(chapterContainer.clientWidth / ChapterHorizontalControl.minChapterItemWidth());

      if (chapterDisplayNumber === 0) {
        chapterDisplayNumber = 1;
      }

      chapteringItemList.setAttribute('data-chapter-item-display', chapterDisplayNumber);
      const chapterItemWidth = Math.floor(innerWidth / chapterDisplayNumber);
      chapteringItemList.setAttribute('data-chapter-item-width', chapterItemWidth);
      const totalItems = chapteringItemList.childNodes.length;
      const listWidth = totalItems * chapterItemWidth;
      let chapterHasScroll = false;

      if (listWidth <= innerWidth) {
        chapterHasScroll = false;
        chapteringItemList.style.left = '0';
        ChapterHorizontalControl.addClass(chapterContainer, 'vjs-viostream-chaptering-noscroll');
      } else {
        chapterHasScroll = true;
        ChapterHorizontalControl.removeClass(chapterContainer, 'vjs-viostream-chaptering-noscroll');
      }

      if (chapterHasScroll) {
        for (let i = 0; i < totalItems; i++) {
          chapteringItemList.childNodes[i].style.width = chapterItemWidth + 'px';
        }
        chapteringItemList.style.width = listWidth + 'px';
        window.setTimeout(() => {
          ChapterHorizontalControl.scrollChapterItemList(
            chapterContainer.querySelector('.vjs-viostream-chapter-item-active'), 
            chapteringItemList
          );
        }, 300);
      } else {
        for (let j = 0; j < totalItems; j++) {
          chapteringItemList.childNodes[j].style.width = 100 / totalItems + '%';
        }
      }
    }

    static addClass(elem, cls) {
      if (elem.className.indexOf(cls) > -1) {
        return;
      }
      elem.className = (elem.className + ' ' + cls).trim();
    }

    static removeClass(elem, cls) {
      if (elem.className.indexOf(cls) === -1) {
        return;
      }
      elem.className = elem.className.replace(cls, '').replace(/\s+/g, ' ');
    }

    static hasClass(elem, cls) {
      return elem.className.indexOf(cls) !== -1;
    }
  }

  videojs.registerComponent('ChapterHorizontalControl', ChapterHorizontalControl);

  /**
   * The class for chapter markers
   */
  class ChapterMarkersProgressBarControl extends Component {
    constructor(player, options) {
      super(player, options);

      if (options.chapters === undefined) {
        options.chapters = [];
      }

      player.ready(() => {
        ChapterMarkersProgressBarControl.addMarkers(options.chapters, player);
      });
    }

    static addMarkers(chapters, player) {
      const videoDuration = player.duration();
      const iMax = chapters.length;
      const playerContainer = player.el();
      const playheadWell = playerContainer.getElementsByClassName('vjs-progress-holder')[0];

      for (let i = 0; i < iMax; i++) {
        if (chapters[i].time < 0 || chapters[i].time > videoDuration) {
          continue;
        }

        const elem = document.createElement('div');
        elem.className = 'vjs-viostream-marker';
        elem.id = 'cp' + i;
        const percentage = chapters[i].time / videoDuration * 100;
        elem.style.left = percentage + '%';
        elem.setAttribute('data-time', chapters[i].time);
        elem.style.cursor = 'pointer';
        
        // Add click handler to marker
        elem.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          const time = parseFloat(elem.getAttribute('data-time'));
          player.currentTime(time);
          player.play();
        };
        
        const spanToolTip = document.createElement('span');
        spanToolTip.className = 'tooltiptext';
        spanToolTip.innerHTML = chapters[i].label;
        elem.appendChild(spanToolTip);
        playheadWell.appendChild(elem);
      }
    }
  }

  videojs.registerComponent('ChapterMarkersProgressBarControl', ChapterMarkersProgressBarControl);

  // Get Plugin class from Video.js 8
  const Plugin = videojs.getPlugin('plugin');
  const defaults = {};

  /**
   * An advanced Video.js plugin for Video.js 8
   */
  class Chapters extends Plugin {
    constructor(player, options) {
      super(player);
      this.options = videojs.obj.merge(defaults, options);

      this.player.ready(() => {
        this.player.addClass('vjs-captions-menu');
      });

      this.player.one('loadedmetadata', () => {
        if (options.chapterType === undefined || options.chapters === undefined) {
          return;
        }

        if (options.chapters.length < 1) {
          return;
        }

        switch (options.chapterType.toLowerCase()) {
          case 'dropdown':
            player.chapterDropdownControl = new ChapterDropdownControl(player, options);
            break;

          case 'native':
          case 'progressbar':
            player.chapterMarkersProgressBarControl = new ChapterMarkersProgressBarControl(player, options);
            break;

          case 'classic':
          case 'classicsmall':
          case 'horizontal':
          default:
            player.ChapterHorizontalControl = new ChapterHorizontalControl(player, options);
            break;
        }
      });
    }
  }

  Chapters.defaultState = {};
  Chapters.VERSION = version;

  // Register the plugin with video.js 8
  videojs.registerPlugin('chapters', Chapters);

  return Chapters;

})));