var SharedFolderAccessDialog=function(e){ContainerSelectionDialog.call(this,e);this.rightHeaderText=this.rightHeader=this.leftHeaderText=this.leftHeader=this.selectedAids=this.member=null};SharedFolderAccessDialog.prototype=Object.create(ContainerSelectionDialog.prototype);SharedFolderAccessDialog.prototype.constructor=SharedFolderAccessDialog;
(function(){SharedFolderAccessDialog.prototype.initialize=function(b){ContainerSelectionDialog.prototype.initialize.apply(this,arguments);this.leftHeader=b.find(".identityLeft .header");this.leftHeaderText=this.leftHeader.text();this.leftPlaceHolder=b.find(".availableSearch");this.leftPlaceHolderText=this.leftPlaceHolder.attr("placeholder");this.rightHeader=b.find(".identityRight .header");this.rightHeaderText=this.rightHeader.text();this.rightPlaceHolder=b.find(".selectedSearch");this.rightPlaceHolderText=
this.rightPlaceHolder.attr("placeholder");this.otherMembersElement=$("#sharedFolderAccessOtherUsers");var a=this;a.inputFields.hidebydefault.onChange(function(b){b?(a.leftHeader.text(a.rightHeaderText),a.leftPlaceHolder.attr("placeholder",a.rightPlaceHolderText),a.rightHeader.text(a.leftHeaderText),a.rightPlaceHolder.attr("placeholder",a.leftPlaceHolderText)):(a.leftHeader.text(a.leftHeaderText),a.leftPlaceHolder.attr("placeholder",a.leftPlaceHolderText),a.rightHeader.text(a.rightHeaderText),a.rightPlaceHolder.attr("placeholder",
a.rightPlaceHolderText))});a.inputFields.applyToOthers.onChange(function(b){b?a.otherMembersElement.show():a.otherMembersElement.hide()})};SharedFolderAccessDialog.prototype.setup=function(){ContainerSelectionDialog.prototype.setup.apply(this,arguments);for(var b=[],a=dialogs.sharedFolder.getDialog().containers.existingMembers.getItemChildren(),c=0,d=a.length;c<d;++c){var f=a[c];f!==this.member&&b.push(new SharedFolderAccessCheckbox(f))}0<b.length&&(this.containers.otherMembers=new Container(b,{allowDrag:!1,
searchInput:"sharedFolderAccessOtherUsersSearch",publishSelect:!1}),this.containers.otherMembers.initialize(document.getElementById("sharedFolderAccessOtherUsersContainer")))};SharedFolderAccessDialog.prototype.open=function(b,a){if(void 0===a){var c={shareid:b.getShareID()};b instanceof SharedFolderUser?c.uid=b.getID():c.cgid=b.getID();LPRequest.makeDataRequest(LPProxy.getSharedFolderRestrictions,{params:c,success:this.createDynamicHandler(function(a){this.open(b,a)})})}else{c=a.aids;this.member=
b;for(var d={},f=0,e=c.length;f<e;++f)d[c[f]]=!0;this.selectedAids=d;if(this.member._sharedGroup.isDownloaded())if(this.availableAids={},c=LPProxy.getItemsByShareID(this.member._sharedGroup.getID()),0===c.length)dialogs.alert.open({title:Strings.translateString("Edit Access"),text:Strings.translateString("Please add items to this folder before editing a member's access.")});else{d=0;for(f=c.length;d<f;++d)e=c[d].getID(),void 0===this.selectedAids[e]&&(this.availableAids[e]=!0);ContainerSelectionDialog.prototype.open.apply(this,
[{title:"Edit Access: "+b.toString(),defaultData:{hidebydefault:"1"===a.hidebydefault}}])}else{var g=this.member._sharedGroup;dialogs.confirmation.open({title:Strings.translateString("Error"),text:Strings.translateString("Folder must be downloaded in order to edit a member's access. Would you like to download now?"),handler:function(){g._sharedFolderItem.startDownloading();Dialog.prototype.closeAllDialogs()}})}}};var e=function(b){b={filter:b};b=LPProxy.getSites(b).concat(LPProxy.getNotes(b));return LPProxy.assignItemsToGroups(b,
!1)};SharedFolderAccessDialog.prototype.getAvailableItems=function(){return e(this.availableAids)};SharedFolderAccessDialog.prototype.getSelectedItems=function(){return e(this.selectedAids)};var g=function(b){for(var a=[],c=0,d=b.length;c<d;++c)a.push(b[c].getID());return a.join(",")};SharedFolderAccessDialog.prototype.getData=function(b){var a=ContainerSelectionDialog.prototype.getData.apply(this,arguments);a.aids="";this.containers.selected&&(a.aids=g(this.containers.selected.getItemModelChildren()));
a.additionaluids="";a.applyToOthers&&this.containers.otherMembers&&(a.additionaluids=g(this.containers.otherMembers.getSelectedModelItems()));return a};SharedFolderAccessDialog.prototype.handleSubmit=function(b){LPRequest.makeRequest(LPProxy.updateSharedFolderRestrictions,{params:$.extend(b,{uid:this.member.getID(!0),shareid:this.member._sharedGroup.getID()})})}})();
