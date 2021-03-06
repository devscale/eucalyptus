/*************************************************************************
 * Copyright 2009-2012 Eucalyptus Systems, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 *
 * Please contact Eucalyptus Systems, Inc., 6755 Hollister Ave., Goleta
 * CA 93117, USA or visit http://www.eucalyptus.com/licenses/ if you need
 * additional information or have any questions.
 ************************************************************************/

(function($, eucalyptus) {
  $.widget('eucalyptus.snapshot', $.eucalyptus.eucawidget, {
    options : { },
    baseTable : null,
    tableWrapper : null,
    delDialog : null,
    createDialog : null,
    registerDialog : null,
    createVolButtonId : 'volume-create-btn',
    createSnapButtonId : 'snapshot-create-btn',
    _init : function() {
      var thisObj = this;
      var $tmpl = $('html body').find('.templates #snapshotTblTmpl').clone();
      var $wrapper = $($tmpl.render($.extend($.i18n.map, help_snapshot)));
      var $snapshotTable = $wrapper.children().first();
      var $snapshotHelp = $wrapper.children().last();
      this.baseTable = $snapshotTable;
      this.tableWrapper = $snapshotTable.eucatable({
        id : 'snapshots', // user of this widget should customize these options,
        dt_arg : {
          "bProcessing": true,
          "sAjaxSource": "../ec2?Action=DescribeSnapshots",
          "fnServerData": function (sSource, aoData, fnCallback) {
                $.ajax( {
                    "dataType": 'json',
                    "type": "POST",
                    "url": sSource,
                    "data": "_xsrf="+$.cookie('_xsrf'),
                    "success": fnCallback
                });

          },
          "sAjaxDataProp": "results",
          "bAutoWidth" : false,
          "sPaginationType": "full_numbers",
          "aoColumns": [
            {
              "bSortable": false,
              "fnRender": function(oObj) { return '<input type="checkbox"/>' },
              "sClass": "checkbox-cell",
            },
            { "mDataProp": "id" },
            {
              "fnRender": function(oObj) { 
                 $div = $('<div>').addClass('table-row-status').addClass('status-'+oObj.aData.status);
                 $div.append(oObj.aData.status=='pending' ?  oObj.aData.progress : '&nbsp;');
                 return asHTML($div);
               },
              "sClass": "narrow-cell",
              "bSearchable": false,
              "iDataSort": 7, // sort on hidden status column
              "sWidth": 50,
            },
            { "mDataProp": "volume_size" },
            { "mDataProp": "volume_id" },
            { "mDataProp": "description" },
            { 
              "fnRender": function(oObj) { return formatDateTime(oObj.aData.start_time); },
              "iDataSort": 8,
            },
            {
              "bVisible": false,
              "mDataProp": "status"
            },
            {
              "bVisible": false,
              "mDataProp": "start_time",
              "sType": "date"
            }
          ],
        },
        text : {
          header_title : snapshot_h_title,
          create_resource : snapshot_create,
          resource_found : 'snapshot_found',
          resource_search : snapshot_search,
          resource_plural : snapshot_plural,
        },
        menu_actions : function(args){ 
          return thisObj._createMenuActions();
        },
        context_menu_actions : function(row) {
          return thisObj._createMenuActions();
        },
        menu_click_create : function (args) { thisObj._createAction() },
        help_click : function(evt) {
          thisObj._flipToHelp(evt, {content: $snapshotHelp, url: help_snapshot.landing_content_url});
        },
        filters : [{name:"snap_state", options: ['all','in-progress','completed'], text: [snap_state_selector_all, snap_state_selector_in_progress, snap_state_selector_completed], filter_col:7, alias: {'in-progress':'pending','completed':'completed'}} ],
        legend : ['pending', 'completed', 'error'],
      });
      this.tableWrapper.appendTo(this.element);
    },

    _create : function() { 
      var thisObj = this;
      // snapshot delete dialog start
      var $tmpl = $('html body').find('.templates #snapshotDelDlgTmpl').clone();
      var $rendered = $($tmpl.render($.extend($.i18n.map, help_snapshot)));
      var $del_dialog = $rendered.children().first();
      var $del_help = $rendered.children().last();
      this.delDialog = $del_dialog.eucadialog({
         id: 'snapshots-delete',
         title: snapshot_delete_dialog_title,
         buttons: {
           'delete': {text: snapshot_dialog_del_btn, click: function() {
               var snapshotsToDelete = thisObj.delDialog.eucadialog('getSelectedResources',0);
               $del_dialog.eucadialog("close");
               thisObj._deleteListedSnapshots(snapshotsToDelete);
            }},
           'cancel': {text: dialog_cancel_btn, focus:true, click: function() { $del_dialog.eucadialog("close");}} 
         },
         help: { content: $del_help, url: help_snapshot.dialog_delete_content_url},
       });
      // snapshot delete dialog end
      // create snapshot dialog start
      $tmpl = $('html body').find('.templates #snapshotCreateDlgTmpl').clone();
      var $rendered = $($tmpl.render($.extend($.i18n.map, help_snapshot)));
      var $snapshot_dialog = $rendered.children().first();
      var $snapshot_dialog_help = $rendered.children().last();
      this.createDialog = $snapshot_dialog.eucadialog({
         id: 'snapshot-create-from-snapshot',
         title: snapshot_create_dialog_title,
         buttons: {
           'create': { domid: thisObj.createSnapButtonId, text: snapshot_create_dialog_create_btn, disabled: true, click: function() { 
                volumeId = $.trim(asText($snapshot_dialog.find('#snapshot-create-volume-id').val()));
                if (VOL_ID_PATTERN.test(volumeId)) {
                  description = toBase64(asText($.trim($snapshot_dialog.find('#snapshot-create-description').val())));
                  $snapshot_dialog.eucadialog("close");
                  thisObj._createSnapshot(volumeId, description);
                } else {
                  thisObj.createDialog.eucadialog('showError', snapshot_create_dialog_error_msg);
                }
              } 
            },
           'cancel': { text: dialog_cancel_btn, click: function() { $snapshot_dialog.eucadialog("close"); } }
         },
         help: { content: $snapshot_dialog_help, url: help_snapshot.dialog_create_content_url },
         on_open: {spin: true, callback: [ function(args) {
           var dfd = $.Deferred();
           thisObj._initCreateDialog(dfd) ; // pulls volumes info from the server
           return dfd.promise();
         }]},
       });
      var $vol_selector = this.createDialog.find('#snapshot-create-volume-id');
      this.createDialog.eucadialog('buttonOnFocus', $vol_selector, thisObj.createSnapButtonId, function(){
        return VOL_ID_PATTERN.test(asText($vol_selector.val()));
      });
      this.createDialog.eucadialog('validateOnType', '#snapshot-create-description', function(description) {
        if (description && description.length>255)
          return long_description;
        else
          return null;
      });
      // create snapshot dialog end
      // snapshot register dialog start
      var $tmpl = $('html body').find('.templates #snapshotRegDlgTmpl').clone();
      var $rendered = $($tmpl.render($.extend($.i18n.map, help_snapshot)));
      var $reg_dialog = $rendered.children().first();
      var $reg_help = $rendered.children().last();
      var registerBtnId = 'snapshot-register-btn'
      this.regDialog = $reg_dialog.eucadialog({
         id: 'snapshots-register',
         title: snapshot_register_dialog_title,
         buttons: {
           'register': {domid: registerBtnId, text: snapshot_dialog_reg_btn, click: function() {
               var name = asText(thisObj.regDialog.find('#snapshot-register-image-name').val());
               if(!name || name.length <= 0) {
                 thisObj.regDialog.eucadialog('showError',snapshot_register_dialog_noname);
                 return; 
               } 
               var desc = toBase64(asText(thisObj.regDialog.find('#snapshot-register-image-desc').val()));
               var $checkbox = thisObj.regDialog.find('#snapshot-register-image-os');
               var windows = $checkbox.is(':checked') ? true : false; 
               thisObj._registerSnapshots(name, desc, windows);
               $reg_dialog.eucadialog("close");
            }, disabled:true},
           'cancel': {text: dialog_cancel_btn, focus:true, click: function() { $reg_dialog.eucadialog("close");}} 
         },
         help: { content: $reg_help, url: help_snapshot.dialog_register_content_url },
         on_open: {callback: [ function(args) {
           var $nameEditor = thisObj.regDialog.find('#snapshot-register-image-name');
           $nameEditor.val('');
           $nameEditor.focus();
           var $descBox = thisObj.regDialog.find('#snapshot-register-image-desc');
           $descBox.val('');
           thisObj.regDialog.find('#snapshot-register-image-os').removeAttr('checked');
           thisObj.regDialog.eucadialog('buttonOnChange', $nameEditor,  registerBtnId, function(){
             return $nameEditor.val() !== '';
           }); 
         }]},
       });
      // snapshot delete dialog end
    },

    _destroy : function() {
    },

    _createMenuActions : function() {
      var thisObj = this;
      var selectedSnapshots = thisObj.baseTable.eucatable('getSelectedRows', 7); // 7th column=status (this is snapshot's knowledge)
      var itemsList = {};
      (function(){
        itemsList['delete'] = { "name": snapshot_action_delete, callback: function(key, opt) {;}, disabled: function(){ return true;} };
        itemsList['create_volume'] = { "name": snapshot_action_create_volume, callback: function(key, opt) {;}, disabled: function(){ return true;} };
        itemsList['register'] = { "name": snapshot_action_register, callback: function(key, opt) {;}, disabled: function(){ return true;} }
      })();

      if ( selectedSnapshots.length > 0 && selectedSnapshots.indexOf('pending') == -1 ){
        itemsList['delete'] = { "name": snapshot_action_delete, callback: function(key, opt) { thisObj._deleteAction(); } }
      }
      
      if ( selectedSnapshots.length === 1 && onlyInArray('completed', selectedSnapshots)){
        itemsList['register'] = { "name": snapshot_action_register, callback: function(key, opt) { thisObj._registerAction(); } }
        itemsList['create_volume'] = { "name": snapshot_action_create_volume, callback: function(key, opt) { thisObj._createVolumeAction(); } }
      }
      return itemsList;
    },

    _initCreateDialog : function(dfd) { // method should resolve dfd object
      var thisObj = this;
      var $volSelector = this.createDialog.find('#snapshot-create-volume-id');
      this.createDialog.find('#snapshot-create-description').val('');
      if(!$volSelector.val()){
        var results = describe('volume');
        var volume_ids = [];
        if ( results ) {
          for( res in results) {
             var volume = results[res];
             if ( volume.status === 'in-use' || volume.status === 'available' ) 
               volume_ids.push(volume.id);
             }
          }
        if ( volume_ids.length === 0 ) {
          this.createDialog.eucadialog('hideButton', thisObj.createSnapButtonId, 'create');
          this.createDialog.find('#snapshot-create-dialog-some-volumes').hide();
          this.createDialog.find('#snapshot-create-dialog-no-volumes').show();
          this.createDialog.find('#snapshot-create-dialog-new-vol').click( function() {
            thisObj._createVolume();
         });
        } else {
          this.createDialog.eucadialog('showButton', thisObj.createSnapButtonId, 'create', true);
          this.createDialog.find('#snapshot-create-dialog-some-volumes').show();
          this.createDialog.find('#snapshot-create-dialog-no-volumes').hide(); 
          $volSelector.autocomplete({
            source: volume_ids,
            select: function() { thisObj.createDialog.eucadialog('activateButton', thisObj.createSnapButtonId); }
          });
          $volSelector.watermark(volume_id_watermark);
        }
      }
      dfd.resolve();
    },

    _getSnapshotId : function(rowSelector) {
      return $(rowSelector).find('td:eq(1)').text();
    },
    
    _createVolume : function(){
      var thisObj = this;
      thisObj.createDialog.eucadialog('close');
      addVolume();
    },

    _deleteListedSnapshots : function (snapshotsToDelete) {
      var thisObj = this;
      var done = 0;
      var all = snapshotsToDelete.length;
      var error = [];

      doMultiAjax(snapshotsToDelete, function(item, dfd){
        var snapshotId = item;
        $.ajax({
          type:"POST",
          url:"/ec2?Action=DeleteSnapshot",
          data:"_xsrf="+$.cookie('_xsrf')+"&SnapshotId="+snapshotId,
          dataType:"json",
          timeout:PROXY_TIMEOUT,
          async:true,
          success: (function(snapshotId) {
            return function(data, textStatus, jqXHR){
              if ( data.results && data.results == true ) {
                ;
              } else {
                error.push({id:snapshotId, reason: undefined_reason});
              }
           }
          })(snapshotId),
          error: (function(snapshotId) {
            return function(jqXHR, textStatus, errorThrown){
              error.push({id:snapshotId, reason: getErrorMessage(jqXHR)});
            }
          })(snapshotId),
          complete: (function(snapshotId) {
            return function(jqXHR, textStatus){
              done++;
              if(done < all)
                notifyMulti(100*(done/all), $.i18n.prop('snapshot_delete_progress', all));
              else {
                var $msg = $('<div>').addClass('multiop-summary').append(
                  $('<div>').addClass('multiop-summary-success').html($.i18n.prop('snapshot_delete_done', (all-error.length), all)));
                if (error.length > 0)
                  $msg.append($('<div>').addClass('multiop-summary-failure').html($.i18n.prop('snapshot_delete_fail', error.length)));
                notifyMulti(100, $msg.html(), error);
              }
              dfd.resolve();
            }
          })(snapshotId),
        });
      });
      thisObj.tableWrapper.eucatable('refreshTable');
    },

    _createSnapshot : function (volumeId, description) {
      var thisObj = this;
      $.ajax({
        type:"POST",
        url:"/ec2?Action=CreateSnapshot",
        data:"_xsrf="+$.cookie('_xsrf')+"&VolumeId="+volumeId+"&Description="+description,
        dataType:"json",
        async:true,
        success:
          function(data, textStatus, jqXHR){
            if ( data.results ) {
              var snapId = data.results.id;
              notifySuccess(null, $.i18n.prop('snapshot_create_success', snapId, volumeId));
              thisObj.tableWrapper.eucatable('refreshTable');
              thisObj.tableWrapper.eucatable('glowRow', snapId);
            } else {
              notifyError($.i18n.prop('snapshot_create_error', volumeId), undefined_error);
            }
          },
        error:
          function(jqXHR, textStatus, errorThrown){
            notifyError($.i18n.prop('snapshot_create_error', volumeId), getErrorMessage(jqXHR));
          }
      });
    },

    _deleteAction : function(){
      var thisObj = this;
      snapshotsToDelete = thisObj.tableWrapper.eucatable('getSelectedRows', 1);
      var matrix = [];
      $.each(snapshotsToDelete,function(idx, key){
        matrix.push([key]);
      });
      if ( snapshotsToDelete.length > 0 ) {
        thisObj.delDialog.eucadialog('setSelectedResources',{title:[snapshot_label], contents: matrix});
        thisObj.delDialog.eucadialog('open');
      }
    },

    _createAction : function() {
      this.dialogAddSnapshot();
    },

    _registerAction : function() {
      this.regDialog.eucadialog('open');
    },

    _createVolumeAction : function() {
      var snapshot = this.tableWrapper.eucatable('getSelectedRows', 1)[0];
      addVolume(snapshot);
    },

    _registerSnapshots : function(name, desc, windows) {
      var thisObj = this;
      var snapshot = thisObj.tableWrapper.eucatable('getSelectedRows', 1);
      var data = "&SnapshotId=" + snapshot + "&Name=" + name + "&Description=" + desc;
      if(windows)
        data += "&KernelId=windows";

      $.ajax({
        type:"POST",
        url:"/ec2?Action=RegisterImage",
        data:"_xsrf="+$.cookie('_xsrf')+data,
        dataType:"json",
        async:true,
        success:
          function(data, textStatus, jqXHR){
            if ( data.results ) {
              notifySuccess(null, $.i18n.prop('snapshot_register_success', snapshot, data.results));  
            } else {
              notifyError($.i18n.prop('snapshot_register_error', snapshot), undefined_error);
            }
          },
        error:
          function(jqXHR, textStatus, errorThrown){
            notifyError($.i18n.prop('snapshot_register_error', snapshot), getErrorMessage(jqXHR));
          }
      });
    },

/**** Public Methods ****/
    close: function() {
//      this.tableWrapper.eucatable('close');
      cancelRepeat(tableRefreshCallback);
      this._super('close');
    },

    dialogAddSnapshot : function(volume) { 
      var thisObj = this;
      var openCallback = function() {
        if(volume){
          var $volumeId = thisObj.createDialog.find('#snapshot-create-volume-id');
          $volumeId.val(volume);
          $volumeId.attr('disabled', 'disabled');
        }
        if(volume)
          thisObj.createDialog.eucadialog('enableButton',thisObj.createSnapButtonId); 
      }
      var on_open = this.createDialog.eucadialog('option', 'on_open'); 
      on_open.callback.push(openCallback);
      this.createDialog.eucadialog('option', 'on_open', on_open);
      this.createDialog.eucadialog('open');
      //if(volume)
       // this.createDialog.eucadialog('enableButton',thisObj.createSnapButtonId); 
    },

    keyAction : function(e) {
      this.tableWrapper.eucatable('keyAction', e);
    },
/**** End of Public Methods ****/
  });
})
(jQuery, window.eucalyptus ? window.eucalyptus : window.eucalyptus = {});
