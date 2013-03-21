/* ===================================================
 * bootstrap-markdown.js v1.0.0
 * http://github.com/toopay/bootstrap-markdown
 * ===================================================
 * Copyright 2013 Taufan Aditya
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */

!function ($) {

  "use strict"; // jshint ;_;


  /* MARKDOWN CLASS DEFINITION
   * ========================== */

  var Markdown = function (element, options) {
    // Class Properties
    this.$ns          = 'bootstrap-markdown'
    this.$element     = $(element)
    this.$editable    = {el:null, type:null,attrKeys:[], attrValues:[], content:null}
    this.$cloneEditor = {el:null, type:null,attrKeys:[], attrValues:[], content:null}
    this.$options     = $.extend(true, {}, $.fn.markdown.defaults, options)
    this.$oldContent  = null
    this.$isPreview   = false
    this.$editor      = null
    this.$textarea    = null
    this.$handler     = []
    this.$callback    = []
    this.$nextTab     = []

    this.showEditor()
  }

  Markdown.prototype = {

    constructor: Markdown

  , showEditor: function() {
      var textarea, 
          ns = this.$ns,
          container = this.$element,
          editable = this.$editable,
          handler = this.$handler,
          callback = this.$callback,
          options = this.$options,
          editor = $( '<div/>', {
                      'class': 'md-editor',
                      click: function() {
                        $( this ).toggleClass( "test" );
                      }
                    })

      // Prepare the editor
      if (this.$editor == null) {
        // Create the panel
        var editorHeader = $('<div/>', {
                            'class': 'md-header'
                            })

        // Build the main buttons
        if (options.buttons.length > 0) {
          editorHeader = this.buildButtons(options.buttons, editorHeader)
        }

        // Build the additional buttons
        if (options.additionalButtons.length > 0) {
          editorHeader = this.buildButtons(options.additionalButtons, editorHeader)
        }

        editor.append(editorHeader)

        // Wrap the textarea
        if (container.is('textarea')) {
          container.before(editor)
          textarea = container
          textarea.addClass('md-input')
          editor.append(textarea)
        } else {
          // This is some arbitrary content that could be edited
          textarea = $('<textarea/>', {
                       'class': 'md-input',
                       'val' : container.html()
                      })

          editor.append(textarea)

          // Save the editable
          editable.el = container
          editable.type = container.prop('tagName').toLowerCase()
          editable.content = container.html()

          $(container[0].attributes).each(function(){
            editable.attrKeys.push(this.nodeName)
            editable.attrValues.push(this.nodeValue)
          })

          // Set editor to blocked the original container
          container.replaceWith(editor)
        }

        textarea
          .on('focus',    $.proxy(this.focus, this))
          .on('keypress', $.proxy(this.keypress, this))
          .on('keyup',    $.proxy(this.keyup, this))

        if (this.eventSupported('keydown')) {
          textarea.on('keydown', $.proxy(this.keydown, this))
        }


        // Create the footer if savable
        if (options.savable) {
          var editorFooter = $('<div/>', {
                           'class': 'md-footer'
                         }),
              saveHandler = 'cmdSave'

          // Register handler and callback
          handler.push(saveHandler)
          callback.push(options.onSave)

          editorFooter.append('<button class="btn btn-success" data-provider="'
                              +ns
                              +'" data-handler="'
                              +saveHandler
                              +'"><i class="icon icon-ok"></i> Save</button>')

          editor.append(editorFooter)
        }

        // Reference
        this.$editor     = editor
        this.$textarea   = textarea
        this.$editable   = editable
        this.$oldContent = this.getContent()

        // Set editor attributes, data short-hand API and listener
        this.$editor.attr('id',(new Date).getTime())
        this.$editor.on('click', '[data-provider="bootstrap-markdown"]', $.proxy(this.handle, this))

      } else {
        this.$editor.show()
      }

      this.$textarea.focus()
      this.$editor.addClass('active')

      // Trigger the onShow hook
      options.onShow(this)
    }

  , buildButtons: function(buttonsArray, container) {
      var i,
          ns = this.$ns,
          handler = this.$handler,
          callback = this.$callback

      for (i=0;i<buttonsArray.length;i++) {
        // Build each group container
        var y, btnGroups = buttonsArray[i]
        for (y=0;y<btnGroups.length;y++) {
          // Build each button group
          var z,
              buttons = btnGroups[y].data,
              btnGroupContainer = $('<div/>', {
                                    'class': 'btn-group'
                                  })

          for (z=0;z<buttons.length;z++) {
            var button = buttons[z],
                buttonHandler = ns+'-'+button.name,
                btnText = button.btnText ? button.btnText : '',
                btnClass = button.btnClass ? button.btnClass : 'btn'

            // Attach the button object
            btnGroupContainer.append('<button class="'
                                    +btnClass
                                    +' btn-small" title="'
                                    +button.title
                                    +'" data-provider="'
                                    +ns
                                    +'" data-handler="'
                                    +buttonHandler
                                    +'"><i class="'
                                    +button.icon
                                    +'"></i> '
                                    +btnText
                                    +'</button>')

            // Register handler and callback
            handler.push(buttonHandler)
            callback.push(button.callback)
          }

          // Attach the button group into container dom
          container.append(btnGroupContainer)
        }
      }

      return container
    }

  , isDirty: function() {
      return this.$oldContent != this.getContent()
    }

  , getContent: function() {
      var textarea = this.$textarea

      return textarea.val()
    }

  , setContent: function(content) {
      var textarea = this.$textarea

      return textarea.val(content)
    }

  , findSelection: function(chunk) {
    var content = this.getContent(), startChunkPosition

    if (startChunkPosition = content.indexOf(chunk), startChunkPosition >= 0 && chunk.length > 0) {
      var oldSelection = this.getSelection(), selection

      this.setSelection(startChunkPosition,startChunkPosition+chunk.length)
      selection = this.getSelection()

      this.setSelection(oldSelection.start,oldSelection.end)

      return selection
    } else {
      return null
    }
  }

  , getSelection: function() {

      var e = this.$textarea[0]

      return (

          ('selectionStart' in e && function() {
              var l = e.selectionEnd - e.selectionStart
              return { start: e.selectionStart, end: e.selectionEnd, length: l, text: e.value.substr(e.selectionStart, l) }
          }) ||

          /* browser not supported */
          function() { 
            return null
          }

      )()

    }

  , setSelection: function(start,end) {

      var e = this.$textarea[0]

      return (

          ('selectionStart' in e && function() {
              e.selectionStart = start
              e.selectionEnd = end
              return 
          }) ||

          /* browser not supported */
          function() { 
            return null
          }

      )()

    }

  , replaceSelection: function(text) {

      var e = this.$textarea[0]

      return (

          ('selectionStart' in e && function() {
              e.value = e.value.substr(0, e.selectionStart) + text + e.value.substr(e.selectionEnd, e.value.length)
              // Set cursor to the last replacement end
              e.selectionStart = e.value.length
              return this
          }) ||

          /* browser not supported */
          function() {
              e.value += text
              return jQuery(e)
          }

      )()

    }

  , getNextTab: function() {
      // Shift the nextTab
      if (this.$nextTab.length == 0) {
        return null
      } else {
        var nextTab, tab = this.$nextTab.shift()

        if (typeof tab == 'function') {
          nextTab = tab()
        } else if (typeof tab == 'object' && tab.length > 0) {
          nextTab = tab
        }

        return nextTab
      } 
    }

  , setNextTab: function(start,end) {
      // Push new selection into nextTab collections
      if (typeof start == 'string') {
        var that = this
        this.$nextTab.push(function(){
          return that.findSelection(start)
        })
      } else if (typeof start == 'numeric' && typeof end == 'numeric') {
        var oldSelection = this.getSelection()

        this.setSelection(start,end)
        this.$nextTab.push(this.getSelection())

        this.setSelection(oldSelection.start,oldSelection.end)
      }

      return
    }

  , alterButtons: function(name,alter) {
      var handler = this.$handler, isAll = (name == 'all'),that = this

      $.each(handler,function(k,v) {
        var halt = true
        if (isAll) {
          halt = false
        } else {
          halt = v.indexOf(name) < 0
        }

        if (halt == false) {
          alter(that.$editor.find('button[data-handler="'+v+'"]'))
        }
      })
    }

  , enableButtons: function(name) {
      var alter = function (el) {
        el.removeAttr('disabled')
      }

      this.alterButtons(name,alter)

      return this
    }

  , disableButtons: function(name) {
      var alter = function (el) {
        el.attr('disabled','disabled')
      }

      this.alterButtons(name,alter)

      return this
    }

  , handle: function(e) {
      var target = $(e.currentTarget),
          handler = this.$handler,
          callback = this.$callback,
          handlerName = target.attr('data-handler'),
          callbackIndex = handler.indexOf(handlerName),
          callbackHandler = callback[callbackIndex]

      // Trigger the focusin
      $(e.currentTarget).focus()

      callbackHandler(this)

      // Unless it was the save handler,
      // focusin the textarea
      if (handlerName.indexOf('cmdSave') < 0) {
        this.$textarea.focus()
      }

      e.preventDefault()
    }

  , eventSupported: function(eventName) {
      var isSupported = eventName in this.$element
      if (!isSupported) {
        this.$element.setAttribute(eventName, 'return;')
        isSupported = typeof this.$element[eventName] === 'function'
      }
      return isSupported
    }

  , keydown: function (e) {
      this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27])
      this.keyup(e)
    }

  , keypress: function (e) {
      if (this.suppressKeyPressRepeat) return
      this.keyup(e)
    }

  , keyup: function (e) {
      var blocked = false
      switch(e.keyCode) {
        case 40: // down arrow
        case 38: // up arrow
        case 16: // shift
        case 17: // ctrl
        case 18: // alt
          break

        case 9: // tab
          var nextTab
          if (nextTab = this.getNextTab(),nextTab != null) {
            // Get the nextTab if exists
            var that = this
            setTimeout(function(){
              that.setSelection(nextTab.start,nextTab.end)
            },200)
          } else {
            // Put the cursor to the end
            this.setSelection(this.getContent().length,this.getContent().length)
          }

          blocked = true
          break

        case 13: // enter
        case 27: // escape
          blocked = false
          break

        default:
          blocked = false
      }

      if (blocked) {
        e.stopPropagation()
        e.preventDefault()
      }
  }

  , focus: function (e) {
      var options = this.$options,
          isHideable = options.hideable,
          editor = this.$editor

      editor.addClass('active')

      // Blur other markdown(s)
      $(body).find('.md-editor').each(function(){
        var md = $(this).data()
        if ($(this).attr('id') != editor.attr('id')) {
          md.blur()
        }
      })
    }

  , blur: function (e) {
      var options = this.$options,
          isHideable = options.hideable,
          editor = this.$editor,
          editable = this.$editable

      editor.removeClass('active')

      if (isHideable && typeof editor != "undefined") {
        // Check for editable elements
        if (editable.el != null) {
          // Build the original element
          var oldElement = $('<'+editable.type+'/>')

          $(editable.attrKeys).each(function(k,v) {
            oldElement.attr(editable.attrKeys[k],editable.attrValues[k])
          })

          // Get the editor content
          oldElement.html(this.getContent())

          editor.replaceWith(oldElement)
        } else {
          editor.hide()
          
        }

        // Trigger the onBlur hook
        options.onBlur(this)
      }
    }

  }

 /* MARKDOWN PLUGIN DEFINITION
  * ========================== */

  var old = $.fn.markdown

  $.fn.markdown = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('markdown')
        , options = typeof option == 'object' && option
      if (!data) $this.data('markdown', (data = new Markdown(this, options)))
    })
  }

  $.fn.markdown.defaults = {
    /* Editor Properties */
    hideable: false,
    savable:false,
    width: 'inherit',
    height: 'inherit',

    /* Buttons Properties */
    buttons: [
      [{
        name: 'groupFont',
        data: [{
          name: 'cmdBold',
          title: 'Bold',
          icon: 'icon icon-bold',
          callback: function(e){
            // Give/remove ** surround the selection
            var chunk, cursor, selected = e.getSelection(), content = e.getContent()

            if (selected.length == 0) {
              // Give extra word
              chunk = 'strong text'
            } else {
              chunk = selected.text
            }

            // transform selection and set the cursor into chunked text
            if (content.substr(selected.start-2,2) == '**' 
                && content.substr(selected.end,2) == '**' ) {
              e.setSelection(selected.start-2,selected.end+2)
              e.replaceSelection(chunk)
              cursor = selected.start-2
            } else {
              e.replaceSelection('**'+chunk+'**')
              cursor = selected.start+2
            }

            // Set the cursor
            e.setSelection(cursor,cursor+chunk.length)
          }
        },{
          name: 'cmdItalic',
          title: 'Italic',
          icon: 'icon icon-italic',
          callback: function(e){
            // Give/remove * surround the selection
            var chunk, cursor, selected = e.getSelection(), content = e.getContent()

            if (selected.length == 0) {
              // Give extra word
              chunk = 'emphasized text'
            } else {
              chunk = selected.text
            }

            // transform selection and set the cursor into chunked text
            if (content.substr(selected.start-1,1) == '*' 
                && content.substr(selected.end,1) == '*' ) {
              e.setSelection(selected.start-1,selected.end+1)
              e.replaceSelection(chunk)
              cursor = selected.start-1
            } else {
              e.replaceSelection('*'+chunk+'*')
              cursor = selected.start+1
            }

            // Set the cursor
            e.setSelection(cursor,cursor+chunk.length)
          }
        },{
          name: 'cmdHeading',
          title: 'Heading',
          icon: 'icon icon-font',
          callback: function(e){
            // Append/remove ### surround the selection
            var chunk, cursor, selected = e.getSelection(), content = e.getContent(), pointer, prevChar

            if (selected.length == 0) {
              // Give extra word
              chunk = 'heading text'
            } else {
              chunk = selected.text
            }

            // transform selection and set the cursor into chunked text
            if ((pointer = 4, content.substr(selected.start-pointer,pointer) == '### ') 
                || (pointer = 3, content.substr(selected.start-pointer,pointer) == '###')) {
              e.setSelection(selected.start-pointer,selected.end)
              e.replaceSelection(chunk)
              cursor = selected.start-pointer
            } else if (prevChar = content.substr(selected.start-2,2), !!prevChar && prevChar != '\n') {
              e.replaceSelection('\n### '+chunk+'\n')
              cursor = selected.start+5
            } else {
              // Empty string before element
              e.replaceSelection('### '+chunk+'\n')
              cursor = selected.start+4
            }

            // Set the cursor
            e.setSelection(cursor,cursor+chunk.length)
          }
        }]
      },{
        name: 'groupLink',
        data: [{
          name: 'cmdUrl',
          title: 'URL/Link',
          icon: 'icon icon-globe',
          callback: function(e){
            // Give [] surround the selection and prepend the link
            var chunk, cursor, selected = e.getSelection(), content = e.getContent(), link

            if (selected.length == 0) {
              // Give extra word
              chunk = 'enter link description here'
            } else {
              chunk = selected.text
            }

            link = prompt('Insert Hyperlink','http://')

            if (link != null) {
              // transform selection and set the cursor into chunked text
              e.replaceSelection('['+chunk+']('+link+')')
              cursor = selected.start+1

              // Set the cursor
              e.setSelection(cursor,cursor+chunk.length)
            }
          }
        },{
          name: 'cmdImage',
          title: 'Image',
          icon: 'icon icon-picture',
          callback: function(e){
            // Give ![] surround the selection and prepend the image link
            var chunk, cursor, selected = e.getSelection(), content = e.getContent(), link

            if (selected.length == 0) {
              // Give extra word
              chunk = 'enter image description here'
            } else {
              chunk = selected.text
            }

            link = prompt('Insert Image Hyperlink','http://')

            if (link != null) {
              // transform selection and set the cursor into chunked text
              e.replaceSelection('!['+chunk+']('+link+' "enter image title here")')
              cursor = selected.start+2

              // Set the next tab
              e.setNextTab('enter image title here')

              // Set the cursor
              e.setSelection(cursor,cursor+chunk.length)
            }
          }
        }]
      },{
        name: 'groupMisc',
        data: [{
          name: 'cmdList',
          title: 'List',
          icon: 'icon icon-list',
          callback: function(e){
            // Prepend/Give - surround the selection
            var chunk, cursor, selected = e.getSelection(), content = e.getContent()

            // transform selection and set the cursor into chunked text
            if (selected.length == 0) {
              // Give extra word
              chunk = 'list text here'
                
              e.replaceSelection('- '+chunk)
            } else {
              if (selected.text.indexOf('\n') < 0) {
                chunk = selected.text

                e.replaceSelection('- '+chunk)
              } else {
                var list = []

                list = selected.text.split('\n')
                chunk = list[0]

                $.each(list,function(k,v) {
                  list[k] = '- '+v
                })

                e.replaceSelection(list.join('\n'))
              }
            }

            // Set the cursor
            cursor = selected.start+2

            // Set the cursor
            e.setSelection(cursor,cursor+chunk.length)
          }
        }]
      },{
        name: 'groupUtil',
        data: [{
          name: 'cmdPreview',
          title: 'Preview',
          btnText: 'Preview',
          btnClass: 'btn btn-inverse',
          icon: 'icon icon-search',
          callback: function(e){
            // Check the preview mode and toggle based on this flag
            var isPreview = e.$isPreview

            if (isPreview == false) {
              // Give flag that tell the editor enter preview mode
              e.$isPreview = true

              // Disable all buttons
              e.disableButtons('all').enableButtons('cmdPreview')

              // Clone the current editor
              var container = e.$textarea,
                  replacementContainer = $('<div/>',{'class':'md-preview','data-provider':'markdown-preview'})

              e.$cloneEditor.el = container
              e.$cloneEditor.type = container.prop('tagName').toLowerCase()
              e.$cloneEditor.content = container.val()

              $(container[0].attributes).each(function(){
                e.$cloneEditor.attrKeys.push(this.nodeName)
                e.$cloneEditor.attrValues.push(this.nodeValue)
              })

              // Build preview element and replace the editor temporarily
              replacementContainer.html(container.val())
              container.replaceWith(replacementContainer)
            } else {
              // Give flag that tell the editor quit preview mode
              e.$isPreview = false

              // Build the original element
              var container = e.$editor.find('div[data-provider="markdown-preview"]'),
                  oldElement = $('<'+e.$cloneEditor.type+'/>')

              $(e.$cloneEditor.attrKeys).each(function(k,v) {
                oldElement.attr(e.$cloneEditor.attrKeys[k],e.$cloneEditor.attrValues[k])
              })

              // Set the editor content
              oldElement.val(e.$cloneEditor.content)
              container.replaceWith(oldElement)

              // Enable all buttons
              e.enableButtons('all')

              // Back to the editor
              e.$textarea = oldElement
              e.$textarea.focus()
            }
          }
        }]
      }]
    ],
    additionalButtons:[], // Place to hook more buttons by code

    /* Events hook */
    onShow: function (e) {},
    onSave: function (e) {},
    onBlur: function (e) {}
  }

  $.fn.markdown.Constructor = Markdown


 /* MARKDOWN NO CONFLICT
  * ==================== */

  $.fn.markdown.noConflict = function () {
    $.fn.markdown = old
    return this
  }

  /* MARKDOWN GLOBAL FUNCTION & DATA-API
  * ==================================== */
  var initMarkdown = function(el) {
    var $this = el
    if ($this.data('markdown')) {
      $this.data('markdown').showEditor()
      return
    }
    $this.markdown($this.data())
  }

  var analyzeMarkdown = function(e) {
    var blurred = false,
        el,
        md,
        $docEditor = $(e.currentTarget)

    // Check whether it was editor childs or not
    if ((e.type == 'focusin' || e.type == 'click') && $docEditor.length == 1 && typeof $docEditor[0] == 'object'){
      el = $docEditor[0].activeElement
      if ( ! $(el).data('markdown')) {
        if (typeof $(el).parent().parent().parent().attr('class') == "undefined"
              || $(el).parent().parent().parent().attr('class').indexOf('md-editor') < 0) {
          if ( typeof $(el).parent().parent().attr('class') == "undefined"
              || $(el).parent().parent().attr('class').indexOf('md-editor') < 0) {
          
                blurred = true
          }
        } else {
          blurred = false
        }
      }

      if (blurred) {
        // Blur event
        $(body).find('.md-editor').each(function(){
          var parentMd = $(el).parent()
          md = $(this).data()

          if ($(this).attr('id') != parentMd.attr('id')) {
            md.blur()
          }
        })
      }

      e.stopPropagation()
    }
  }

  $(document)
    .on('click.markdown.data-api', '[data-provide="markdown-editable"]', function (e) {
      $(this).data('hideable',true)
      $(this).data('savable',true)
      initMarkdown($(this))
      e.preventDefault()
    })
    .on('click', function (e) {
      analyzeMarkdown(e)
    })
    .on('focusin', function (e) {
      analyzeMarkdown(e)
    })
    .ready(function(){
      initMarkdown($('textarea[data-provide="markdown"]'))
    })

}(window.jQuery);