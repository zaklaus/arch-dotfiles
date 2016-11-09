// Cookies App for Google Chrome - HOTCLEANER.COM - Copyright (c) 2014 Vlad & Serge Strukoff. All Rights Reserved.
(function() {
  var opt = 0,                        // options
  ce_menu_ind = 0,                    // selected menu index, $(vm+ce_menu_ind)
  ce_clist = [0,0],                   // all stored cookies
  ce_sel = [0,0],                     // current selected node's or item's element with class dbtn or cbtn
  ce_sel_ind = [-1,-1],               // selected cookie index in ce_clist or -1
  ce_domains_count = [0,0],           // hosts count, excluding removed
  ce_cookies_count = [0,0],           // cookies count, excluding removed
  ce_ctl = [0,0,0];                   // add/remove to whitelist, add to encrypted storage and delete buttons
  
  chrome.runtime.sendMessage('{"id":0}', isReady);

  function isReady() {  
    if (document.readyState == 'complete')
      chrome.runtime.sendMessage('{"id":31}', init);  
    else 
      setTimeout(isReady, 100);
  };
        
  function init(r) {
    opt = r.v;
    
    ce_offCookProps(true);
    
    ce_ctl[0] = ce_createCtl(0);
    ce_ctl[1] = ce_createCtl(24);
    ce_ctl[2] = ce_createCtl(48);
    
    ce_getCookList( function() {
      
      $('refresh').addEventListener('click', ce_getCookList, !1);
      
      $('search0').addEventListener('input', function(e) {
        ce_genTree(0);
      }, !1);
      
      $('search1').addEventListener('input', function(e) {
        ce_genTree(1);
      }, !1);
      
      $('csession').addEventListener('click', function(e) {
        $('cdate').disabled = $('ctime').disabled = this.checked;  
      }, !1);
      
      $('applyCookie').addEventListener('click', ce_getCookProps,!1);
      $('addCookie').addEventListener('click', ce_getCookProps,!1);
      
      $('setPass').addEventListener('click', ce_promptPass,!1);
      
      // init header menu
      for (var i = 0; i < 9; i++)
        $('m'+i).addEventListener('click', ce_onLink, !1);
        
      // init vertical menu
      for (var i = 0; i < 2; i++)
        $('vm'+i).addEventListener('click', ce_onMenu, !1);
      
      // Cookies
      $('except').addEventListener('click', ce_onExcept, !1);
      $('delCookies').addEventListener('click', ce_onDelAllCookies, !1);
      $('delAllCookies').addEventListener('click', ce_onDelAllCookies, !1);
      
      // Encryptes Storage
      $('expStor').addEventListener('click', ce_onExport, !1);
      $('sf').addEventListener('change', ce_onImport, !1);
      $('impStor').addEventListener('click', function(e) {
        $('sf').click();
      }, !1);
      $('delAll').addEventListener('click', ce_onDelAllCookies, !1);
      
      $('passOk').addEventListener('click', ce_onPassOk, !1);
      $('passCancel').addEventListener('click', ce_onPassCancel,!1);
      
      // if exist, set selection to the first item
      var tree = $('tree0');
      if (tree.firstElementChild) {
        ce_expandNode(tree.firstElementChild);
        tree.firstElementChild.nextElementSibling.firstElementChild.firstElementChild.click();
      }
    });
    
    document.body.style.display = 'block';
    $('vm0c').style.display = '-webkit-box';
    $('vm0').classList.add('vmact');
  };
  
  // Fires when vertical menu are clicked
  function ce_onMenu(e) {
    
    $('vm'+ce_menu_ind+'c').style.display = 'none'; 
    $(this.id+'c').style.display = '-webkit-box';
    
    $('vm'+ce_menu_ind).classList.remove('vmact'); 
    this.classList.add('vmact');
    
    ce_menu_ind = parseInt(this.id.charAt(2));
    
    ce_onPassCancel();
        
    if (ce_menu_ind == 0)
      ce_setSel(ce_sel[0]);
    else if (ce_menu_ind == 1) {  
      ce_getElist(function() {
        ce_setSel(ce_sel[1]);
      });
    }
      
    e.stopPropagation();
  };
  
  // Fires when expand/collapse node are clicked
  function ce_onExpand(e) {
    ce_expandNode(this.parentElement);
    e.stopPropagation();
  };
  
  function ce_expandNode(node) {
    var list = node.nextElementSibling;
    if (!list.offsetHeight) {
      list.style.display = 'block';
      list.style.height = 'auto';
      node.style.backgroundPosition = '0px -29px';
    }
    else {
      list.style.display = 'none';
      list.style.height = '0px';
      node.style.backgroundPosition = '0px 0px';
    }
  };
  
  // Fires when node's link are clicked
  function ce_onLink(e) {
    e.preventDefault();
    e.stopPropagation();
    chrome.runtime.sendMessage(JSON.stringify({id:20,data:{url:this.href,selected:true}}));  
  };
  
  function ce_onExcept(e) {
    chrome.runtime.sendMessage(JSON.stringify({id:20,data:{url:'chrome://settings/contentExceptions#cookies',selected:true}}));
    e.stopPropagation();
  };
  
  // Fires when node/item name(button) are clicked
  function ce_onName(e) {
    ce_setSel(this);
    e.stopPropagation();
  };
  
  // set selection to node name or item name element
  function ce_setSel(btn) {
    if (!btn)
      return;
      
    if (ce_sel[ce_menu_ind])
      ce_sel[ce_menu_ind].removeAttribute('data-sel');
      
    ce_sel[ce_menu_ind] = btn;
    btn.setAttribute('data-sel', 1);
    
    // set buttons titles/images
    ce_setCtlTitle(btn);
    
    // insert buttons
    var p = btn.parentElement;
    p.appendChild(ce_ctl[2]);
    p.appendChild(ce_ctl[1]); 
    p.appendChild(ce_ctl[0]);
    
    if (btn.className == 'cbtn') {
      ce_sel_ind[ce_menu_ind] = parseInt(p.getAttribute('data-ind'));
      ce_setCookProps();
    }
    else {
      ce_sel_ind[ce_menu_ind] = -1;
      ce_offCookProps(true);
    }
  };
  
  // Fires when add/remove to/from whitelist, add to encrypted database or remove cookie/domain are clicked
  function ce_onCtl(e) {
    var el = this.parentElement, bNode =  el.className == 'node' ? 1:0;
    
    function showList(indHide, indShow) {
      $('vm'+indHide+'c').style.display = 'none'; 
      $('vm'+indShow+'c').style.display = '-webkit-box';
      
      $('vm'+indHide).classList.remove('vmact'); 
      $('vm'+indShow).classList.add('vmact');
    
      ce_menu_ind = indShow;
      ce_onPassCancel();
    };
      
    // Stored Cookies ctls
    if (ce_menu_ind == 0) {
      
      if (bNode) {
        // Add/Remove all domain cookies from the whitelist
        if (this == ce_ctl[2])
          ce_nodeToFromWlist(0, el);
        
        // Add all domain cookies to the encrypted storage
        else if (this == ce_ctl[1]) {
          showList(0,1);
          ce_getElist(function() {  
            var item = el.nextElementSibling.firstElementChild, i, cookie;
            while (item) {
              i = item.getAttribute('data-ind');
              cookie = ce_clist[0][i];
              item = item.nextElementSibling;
              ce_setCookie(1, cookie, false, false, false);
            }
            ce_saveElist();
          });
        }
        
        // Erase all domain cookies
        else if (this == ce_ctl[0])
          ce_delNode(0, el);
      }
      
      // Item
      else {
      
        // Add/Remove cookie from the whitelist
        if (this == ce_ctl[2])
          ce_itemToFromWlist(0, el);
          
        // Add cookie to the encrypted storage
        else if (this == ce_ctl[1]) {
          showList(0,1);
          var i = el.getAttribute('data-ind'), cookie = ce_clist[0][i];
          ce_getElist(function() {
            ce_setCookie(1, cookie, false, true, true);
          });
        }
        
        // Erase cookie
        else if (this == ce_ctl[0])
          ce_delItem(0, el);
      }
    }
     
    // Encrypted Storage ctls
    else if (ce_menu_ind == 1) {
      if (bNode) {
        
        // Restore all domain cookies
        if (this == ce_ctl[1]) {
          showList(1,0);  
          var item = el.nextElementSibling.firstElementChild, i, cookie;
          while (item) {
            i = item.getAttribute('data-ind');
            cookie = ce_clist[1][i];
            ce_setCookie(0, cookie, true, false, true);
            item = item.nextElementSibling;
          }
        }
        
        // Erase all domain cookies
        else if (this == ce_ctl[0])
          ce_delNode(1, el);
      }
      
      // Item
      else {
          
        // Restore cookie
        if (this == ce_ctl[1]) {
          showList(1,0);
          var i = el.getAttribute('data-ind'), cookie = ce_clist[1][i];
          ce_setCookie(0, cookie, true, true, true);
        }
        
        // Erase cookie
        else if (this == ce_ctl[0])
          ce_delItem(1, el);
      }  
    }
        
    e.stopPropagation();
  };
  
  function ce_setCtlTitle(btn) {
    var cbtn = btn.className == 'cbtn' ? 1 : 0, wl = btn.hasAttribute('data-wl');
    // Stored Cookies controls
    if (ce_menu_ind == 0) {
      ce_ctl[2].style.visibility = 'visible';
      
      ce_ctl[0].style.backgroundPosition = '4px -140px';
      ce_ctl[1].style.backgroundPosition = '4px -168px';
      ce_ctl[2].style.backgroundPosition = (wl ? '4px -280px' : '4px -252px');
      
      ce_ctl[2].title =  wl ? ( cbtn ? 'Remove this cookie' : 'Remove all '+btn.textContent+' cookies')+' from the whitelist' : ( cbtn ? 'Add this cookie' : 'Add all '+btn.textContent+' cookies')+' to the whitelist';
      ce_ctl[1].title = (cbtn ? 'Add this cookie' : 'Add all '+btn.textContent+' cookies')+' to the Encrypted Storage';
      ce_ctl[0].title = cbtn ? 'Erase this cookie' : 'Erase all '+btn.textContent+' cookies';
    }
    // Encrypted Storage controls 
    else if (ce_menu_ind == 1) {
      ce_ctl[2].style.visibility = 'hidden';
      
      ce_ctl[0].style.backgroundPosition = '4px -140px';
      ce_ctl[1].style.backgroundPosition = '4px -308px';
      
      ce_ctl[0].title = cbtn ? 'Remove this cookie' : 'Remove all '+btn.textContent+' cookies'+' from the Encrypted Storage';
      ce_ctl[1].title = (cbtn ? 'Restore this cookie' : 'Restore all '+btn.textContent+' cookies');   
    }  
  };
  
  // Enable/Disable properties
  function ce_offCookProps(bDisable) {
    var prop = $('prop'), shade = $('pshade');
    if (bDisable) {
      shade.style.display = 'block';
      prop.style.display = 'none';
    }
    else {
      prop.style.display = 'block';
      shade.style.display = 'none'; 
    } 
  };
  
  // Enable/Disable all controls
  function ce_offCtrls(bDisable, ind, menu) {
    var rg = [];
    if (ind == 0)
      rg = ['refresh','search0','delCookies','delAllCookies','applyCookie','addCookie'];
    else if (ind == 1)  
      rg = ['search1','impStor','expStor','setPass','delAll'];
    if (menu)
      rg.push('vm0','vm1');
      
    for (var i = 0; i < rg.length; i++)
      $(rg[i]).disabled = bDisable;
  };
  
  // Fill properties
  function ce_setCookProps() {
    var sel_ind = ce_sel_ind[ce_menu_ind], c = ce_clist[ce_menu_ind][sel_ind], _date = $('cdate'),  _time = $('ctime'), _lname = $('lcname'), _name = $('cname'), _aname = $('caname'),  _laname = $('lcaname');
    $('cdomain').value = c.domain;
    _name.value = c.name;
    _aname.value = '';
    // Stored Cookies
    if (ce_menu_ind == 0) {
      _laname.style.display = _aname.style.display = 'none';
      _lname.className = 'pw4';
      _name.className = 'pw4 stl';
    }
    // Encrypted Storage cookies has advanced alias name param
    else if (ce_menu_ind == 1) {
      _lname.className = 'pw3';
      _name.className = 'pw3 stl';
      _laname.style.display = _aname.style.display = 'inline-block';
      if (c.a)
        _aname.value = c.a;
    }
    
    $('cvalue').value = c.value;
    $('cpath').value = c.path;
    //$('cdate').value = c.session ? 'When I close my browser' : new Date(c.expirationDate*1000).toLocaleString();
    if (c.session)
      _date.disabled = _time.disabled = true;
    else {
      var d = new Date(c.expirationDate*1000); 
      _date.value = d.getFullYear()+'-'+n(d.getMonth()+1)+'-'+n(d.getDate());
      _time.value = n(d.getHours())+':'+n(d.getMinutes());
      _date.disabled = _time.disabled = false;
    }
    $('csession').checked = c.session;
    $('chostOnly').checked = c.hostOnly;
    $('chttpOnly').checked = c.httpOnly;
    $('csecure').checked = c.secure;
    $('cstoreid').value = c.storeId;
    
    ce_offCookProps(false);
    
    function n(d) {
      return d < 10 ? '0'+d : d;  
    };
  };
  
  
  // Apply properties. Update existing or create new cookie
  function ce_getCookProps(e) {
  
    if (ce_sel_ind[ce_menu_ind] > -1) { 
      var _domain = $('cdomain'), _name = $('cname'), _date = $('cdate'), _time = $('ctime'), session = $('csession').checked, c = {};
      
      // check validity
      if (!_domain.validity.valid || _domain.value.length < 1) { alert('Invalid domain name format!'); return; }
      if (!session) {
        if (!_date.validity.valid || _date.value.length < 1) { alert('Invalid date format!'); _date.focus(); return; }
        if (!_time.validity.valid || _time.value.length < 1) { alert('Invalid time format!'); _time.focus(); return; }
      }
      
      // get props  
      c.domain = _domain.value;
      c.name = _name.value;
      c.value = $('cvalue').value;
      c.path = $('cpath').value;
      c.session = session;
      if (session)
        c.expirationDate = undefined;
      else {
        var date = Date.parse(_date.value+' '+_time.value), offset = new Date().getTimezoneOffset()*60000;
        if (isNaN(date)) { alert('Invalid date or time format!'); _date.focus(); return; }
        c.expirationDate = (date)/1000;
      }
      c.hostOnly = $('chostOnly').checked;
      c.httpOnly = $('chttpOnly').checked;
      c.secure = $('csecure').checked;
      c.storeId = $('cstoreid').value;
      
      if (ce_menu_ind == 0)
        ce_setCookie(0, c, true, true, true);
  
      else if (ce_menu_ind == 1) {
        if ($('caname').value.length > 0)
          c.a = $('caname').value;
        
        var item = ce_sel[1].parentElement, i = parseInt(item.getAttribute('data-ind')), sel_cookie = ce_clist[1][i];
        if (sel_cookie.name == c.name && sel_cookie.domain == c.domain)
          ce_updateCookie(1, item, c, false);
        else
          ce_setCookie(1, c, false, true, true);
      }
    }
    e.stopPropagation(); 
  };
  
  function ce_duplCookieObj(c) {
    return {name:c.name,value:c.value,domain:c.domain,hostOnly:c.hostOnly,path:c.path,secure:c.secure,httpOnly:c.httpOnly,session:c.session,expirationDate:c.expirationDate,storeId:c.storeId};
  };
  
  function ce_updateCookie(ind, item, cookie, bSelect) {
    cookie.host = cookie.domain;
    if (cookie.host.charAt(0) == '.')
      cookie.host = cookie.host.slice(1);
    
    var i = item.getAttribute('data-ind'), c = {}, cbtn = item.firstElementChild;
    
    // set cookie params
    c.host = cookie.host;
    c.domain = cookie.domain;
    c.name = cookie.name;
    c.value = cookie.value;
    c.path = cookie.path;
    c.session = cookie.session;
    c.expirationDate = cookie.expirationDate;
    c.hostOnly = cookie.hostOnly;
    c.httpOnly = cookie.httpOnly;
    c.secure = cookie.secure;
    c.storeId = cookie.storeId;
    
    // Stored Cookies
    if (ind == 0) {
      if (cookie.w) {
        c.w = 1;
        chrome.runtime.sendMessage(JSON.stringify({id:3,data:c})); // update whitelisted cookie
      }
    }
    
    // Encrypted Storage
    else if (ind == 1) {
      if (cookie.a) {
        c.a = cookie.a;
        cbtn.firstElementChild.textContent = c.name+' - '+c.a;
      } else {
        c.a = 0;
        cbtn.firstElementChild.textContent = c.name;
      }
    }
    
    ce_clist[ind].splice(i, 1, c); // Update cookie at specified index
    
    // Stored Cookies
    if (ind == 0)
      chrome.runtime.sendMessage(JSON.stringify({id:8,data:c})); // set cookie into browser
    else if (ind == 1)
      ce_saveElist(); // save encrypted database
    
    // set item image
    if (c.secure)
      cbtn.style.backgroundPosition = '0px '+(c.session ? '-84px':'-56px');
    else
      cbtn.style.backgroundPosition = c.session ? '0px -28px':'';
    
    if (bSelect) {
      var list = item.parentElement, node = list.previousElementSibling;
      if (!list.offsetHeight)
        ce_expandNode(node);
      ce_setSel(cbtn);
    }  
  };
  
  // set cookie or set new cookie and add to the tree. [sel] - select or not cookie item in the tree
  function ce_setCookie(ind, cookie, bUpdate, bSelect, bSave) {
    cookie.host = cookie.domain;
    if (cookie.host.charAt(0) == '.')
      cookie.host = cookie.host.slice(1);
    
    var i, node = $(cookie.host+'_'+ind), item, cbtn, search = $('search'+ind), insert = 1;
    
    // insert into tree or not
    if (search.value.length > 0) {
      if (cookie.host.indexOf(search.value) < 0)
        insert = 0;
    }
    
    if (node) {
      var cookie_name = cookie.name, item_name;
      item = node.nextElementSibling.firstElementChild; 
      while(item) {
        item_name = ce_clist[ind][parseInt(item.getAttribute('data-ind'))].name;
        if (bUpdate && cookie_name == item_name) {
          ce_updateCookie(ind, item, cookie, bSelect);
          return;
        }
        else if (cookie_name < item_name)
          break;
        item = item.nextElementSibling;
      }
    }
    else {
      if (insert) {
        var tree = $('tree'+ind);
        node = tree.firstElementChild;
        while(node) {
          if (cookie.host < node.id)
            break;
          node = ce_nextNode(node);
        }
        node = ce_addNode(ind, tree, cookie.host, node);
        ce_domains_count[ind]++;
      }
    }
    
    var c = {};
    // copy cookie object
    c.host = cookie.host;
    c.domain = cookie.domain;
    c.name = cookie.name;
    c.value = cookie.value;
    c.path = cookie.path;
    c.session = cookie.session;
    c.expirationDate = cookie.expirationDate;
    c.hostOnly = cookie.hostOnly;
    c.httpOnly = cookie.httpOnly;
    c.secure = cookie.secure;
    c.storeId = cookie.storeId;
    
    i = ce_clist[ind].push(c)-1;
    
    // Stored Cookies
    if (ind == 0)  
      chrome.runtime.sendMessage(JSON.stringify({id:8,data:c})); // set cookie
    else if (ind == 1 && bSave == true)
      ce_saveElist();
    
    if (insert) {
      cbtn = ce_addItem(ind, i, node, item);
      ce_cookies_count[ind]++;
      
      if (bSelect) {
        if (!node.nextElementSibling.offsetHeight)
          ce_expandNode(node);
        ce_setSel(cbtn);
      }
      
      ce_setCounter(ind);
    }    
  };
  
  function ce_itemFromWlist(ind, item) {
    var i = parseInt(item.getAttribute('data-ind')), c = ce_clist[ind][i];
    chrome.runtime.sendMessage(JSON.stringify({id:4,data:[c]}));
    item.firstElementChild.removeAttribute('data-wl');
    ce_clist[ind][i].w = 0;
  };
  
  function ce_itemToWlist(ind, item) {
    var i = parseInt(item.getAttribute('data-ind')), c = ce_duplCookieObj(ce_clist[ind][i]);
    chrome.runtime.sendMessage(JSON.stringify({id:2,data:[c]}));
    item.firstElementChild.setAttribute('data-wl', 1);
    ce_clist[ind][i].w = 1;
  };
  
  function ce_itemToFromWlist(ind, item) {
    if (item.firstElementChild.hasAttribute('data-wl'))
      ce_itemFromWlist(ind, item);
    else
      ce_itemToWlist(ind, item);
      
    ce_listHasWlisted(item.parentElement);
    
    ce_setCtlTitle(item.firstElementChild);
  };
  
  function ce_nodeToFromWlist(ind, node) {
    var dbtn = ce_nextNode(node.firstElementChild),
    list = node.nextElementSibling,
    item = list.firstElementChild,
    fn;
    
    if (dbtn.hasAttribute('data-wl')) {
      dbtn.removeAttribute('data-wl');
      fn = ce_itemFromWlist; 
    }
    else {
      dbtn.setAttribute('data-wl', 1);
      fn = ce_itemToWlist;
    }
    
    while(item) {
      fn(ind, item);
      item = item.nextElementSibling;
    }
    
    ce_setCtlTitle(dbtn);
  };
  
  function ce_delItem(ind, item) {
    var i = parseInt(item.getAttribute('data-ind')),
    c = ce_clist[ind][i],
    list = item.parentElement,
    node = list.previousElementSibling,
    sel_item = item.nextElementSibling;
  
    if (!sel_item)
      sel_item = item.previousElementSibling;
    
    list.removeChild(item);
    
    c.r = 1;  
    ce_cookies_count[ind]--;
    
    // Stored Cookies
    if (ind == 0) {
      if (c.w) {
        chrome.runtime.sendMessage(JSON.stringify({id:4,data:[c]})); // delete cookie from the whitelist
        c.w = 0;
        ce_listHasWlisted(list);
      }
      chrome.runtime.sendMessage(JSON.stringify({id:9,data:c})); // delete cookie
    }
    
    // Encrypted Storage
    else if (ind == 1)
      ce_saveElist();
    
    // select next or previous item
    if (sel_item)
      ce_setSel(sel_item.firstElementChild);
    else {
      ce_offCookProps(1);
      ce_delNode(ind, node);
    }
    
    ce_setCounter(ind);      
  };
  
  function ce_delNode(ind, node) {
    var tree = $('tree'+ind), list = node.nextElementSibling, item = list.firstElementChild, del_item, i, c, rg = [], sel_node = ce_nextNode(node);
    
    // get next or previous node
    if (!sel_node)      
      sel_node = ce_prevNode(node);
    
    // remove items  
    while(item) {
      i = parseInt(item.getAttribute('data-ind'));
      c = ce_clist[ind][i];
      c.r = 1; 
      ce_cookies_count[ind]--;
      
      // Stored Cookies
      if (ind == 0) {
        if (c.w) {
          rg.push(c);
          c.w = 0;
        }
        chrome.runtime.sendMessage(JSON.stringify({id:9,data:c})); // delete cookie
      }
        
      del_item = item;
      item = item.nextElementSibling;
      list.removeChild(del_item); 
    }
    
    if (ind == 0) {
      if (rg.length > 0)
        chrome.runtime.sendMessage(JSON.stringify({id:4,data:rg})); // delete cookie(s) from the whitelist
        
    } else if (ind == 1)
      ce_saveElist();
    
    // remove list and node
    tree.removeChild(list);
    tree.removeChild(node);
    
    // select next or previous node 
    if (sel_node)
      ce_setSel(ce_nextNode(sel_node.firstElementChild));
    
    ce_domains_count[ind]--;
    ce_setCounter(ind);
  };
  
  // Delete all cookies, including or excluding whitelisted
  function ce_onDelAllCookies(e) {
    var s = 'Are you sure you want to delete all cookies',
    f = $('search0').value,
    w = 3;
    
    // Cookies
    if (this.id == 'delAllCookies') {
      s+=',\nincluding whitelisted?';
      w = 1;
    }
    else if (this.id == 'delCookies') {
      s+=',\nexcluding whitelisted?';
      w = 0;
    }
    else
      s+='\nfrom the Encrypted Storage?';
    
    if (!confirm(s))
      return;
    
    ce_offCookProps(true);
     
    if (w == 3) {
      ce_clist[1] = [];
      ce_saveElist();
      ce_genTree(1);
    }
    else {
      chrome.runtime.sendMessage(JSON.stringify({id:10,data:{w:w,f:f}}), function() {
        ce_getCookList();
      });
    }
    
    e.stopPropagation();  
  };
  
  function ce_addItem(ind, i, _node, _before) {
    var c = ce_clist[ind][i],
    _item = document.createElement('DIV'),
    _cbtn = document.createElement('BUTTON'),
    _cname = document.createElement('B');
    
    _item.className = 'item';
    _cbtn.className = 'cbtn';
    _cname.className = 'cname elps';
  
    if (ind == 0)
      _cname.textContent = c.name;
    else if (ind == 1)
      _cname.textContent = c.a ? c.name+' - '+c.a : c.name;
    
    if (c.w) {
      _cbtn.setAttribute('data-wl', 1);
      ce_nextNode(_node.firstElementChild).setAttribute('data-wl', 1);
    }
    
    // set item image
    if (c.secure)
      _cbtn.style.backgroundPosition = '0px '+(c.session ? '-84px':'-56px');
    else
      _cbtn.style.backgroundPosition = c.session ? '0px -28px':'';
    
    _item.setAttribute('data-ind', i);
    
    _item.appendChild(_cbtn).appendChild(_cname);
    _before ? _node.nextElementSibling.insertBefore(_item, _before) : _node.nextElementSibling.appendChild(_item);
  
    _cbtn.addEventListener('click', ce_onName, !1);
    _cbtn.addEventListener('focus', ce_onName, !1);
    
    return _cbtn;
  };
  
  
  function ce_addNode(ind, _tree, node_name, _before) {
    var _node = document.createElement('DIV'), 
    _exp = document.createElement('INPUT'),
    _site = document.createElement('A'),
    _dbtn = document.createElement('BUTTON'),
    _dname = document.createElement('B'),
    _list = document.createElement('DIV'); 
    
    _exp.type = 'checkbox';
    
    _node.id = node_name+'_'+ind;
    _node.className = 'node';
    _exp.className = 'exp';
    _site.className = 'site';
    _dbtn.className = 'dbtn';
    _dname.className = 'dname elps';
    _list.className = 'list';
    
    _dname.textContent = node_name;
    
    _list.style.backgroundRepeat = 'repeat-y';
    
    _node.appendChild(_exp);
    _node.appendChild(_site);
    _node.appendChild(_dbtn).appendChild(_dname);
    
    _before ? _tree.insertBefore(_node, _before) : _tree.appendChild(_node);
    _before ? _tree.insertBefore(_list, _before) : _tree.appendChild(_list);
    
    _exp.addEventListener('click', ce_onExpand, 0);
    _site.setAttribute('href', 'http://'+node_name);
    _site.addEventListener('click', ce_onLink, !1); 
    _dbtn.addEventListener('click', ce_onName, !1);
    _dbtn.addEventListener('focus', ce_onName, !1);
  
    return _node;
  };
  
  function ce_listHasWlisted(list) {
    var item = list.firstElementChild, 
    node = list.previousElementSibling,
    dbtn = ce_nextNode(node.firstElementChild);
    while(item) {
      if (item.firstElementChild.hasAttribute('data-wl')) {
        dbtn.setAttribute('data-wl', 1);
        return 1;  
      }
      item = item.nextElementSibling;
    }
    dbtn.removeAttribute('data-wl');
    return 0;
  };
  
  function ce_genFilteredList(ind, filter, cb) {
    ce_offCookProps(1);
    var tree = $('tree'+ind), node = 0, list = ce_clist[ind], cookie = 0, host = 0,  show = 0;
    tree.innerHTML = '';
    
    for (var i = 0; i < list.length; i++) {
      cookie = list[i];
      if (!cookie.r) { // exclude removed cookies
        if (host != cookie.host) {
          show = 0;
          if (cookie.host.indexOf(filter) > -1) {
            node = ce_addNode(ind, tree, cookie.host);
            ce_domains_count[ind]++;
            show = 1;
          }
        }
        
        if (show) {
          ce_addItem(ind, i, node);
          ce_cookies_count[ind]++;
        }
        
        host = cookie.host;
      }
    }
    
    ce_setCounter(ind);
    if (typeof cb == 'function') cb();
    ce_offCtrls(false, ind, 1);
  };
  
  // [ind] - tree index
  function ce_genTree(ind, cb) {
    ce_offCookProps(1);
    ce_offCtrls(true, ind, 1);
    
    var search = $('search'+ind), tree = $('tree'+ind), node = 0, host = 0, len = ce_clist[ind].length;
      
    ce_sel_ind[ind] = -1, ce_sel[ind] = 0, ce_domains_count[ind] = 0, ce_cookies_count[ind] = 0;
    
    if (search.value.length > 0) {
      ce_genFilteredList(ind, search.value, cb);
      return;
    }
    
    tree.innerHTML = '';
    loop(0);
    
    function loop(a) {
      var b = a+257;
      if (b > len)
        b = len; 
        
      for (var i = a; i < b; i++) {
        if (!ce_clist[ind][i].r) { // exclude removed array items
          if (host != ce_clist[ind][i].host) {
            node = ce_addNode(ind, tree, ce_clist[ind][i].host);
            ce_domains_count[ind]++;
          }
  
          ce_addItem(ind, i, node);
          ce_cookies_count[ind]++;
          
          host = ce_clist[ind][i].host;
        }
      }
      
      if (b < len) {
        ce_setCounter(ind);
        setTimeout(loop, 100, b);
      }
      else {
        ce_setCounter(ind);
        ce_offCtrls(false, ind, 1);
        if (typeof cb == 'function') cb();
      }  
    };    
  };
  
  function ce_setCounter(ind) {
    $('count'+ind).textContent = ce_cookies_count[ind]+' cookies from '+ce_domains_count[ind]+' domains';
  };
  
  function ce_getCookList(cb) {
    
    ce_offCtrls(true, 0, 1);
    
    chrome.runtime.sendMessage('{"id":6}', function(cookies) {
      
      for (var i = 0; i < cookies.length; i++) {
        if (cookies[i].domain.charAt(0) == '.')
          cookies[i].host = cookies[i].domain.slice(1);
        else
          cookies[i].host = cookies[i].domain;
      }
      cookies = cookies.sort(ce_sortHosts);
      ce_clist[0] = cookies;
      ce_genTree(0,cb);
    });    
  };
  
  function ce_sortHosts(a, b) {
    var c = a.host+a.name, d = b.host+b.name;
    if (c < d)
      return -1;
    else if (c > d)
      return 1;
    return 0;
  };
  
  // create add/remove from whitelist, add to encrypted storage, delete,... buttons
  function ce_createCtl(x) {
    var btn = document.createElement('input');
    btn.type = 'button';
    btn.className = 'ctl';
    btn.style.right = x+'px'; 
    //document.body.appendChild(btn);
    
    // blacklist or whitelist item
    btn.addEventListener('click', ce_onCtl, !1);
    return btn;
  };
  
  /// Encrypted Storage - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var ce_passType = 0,            // show pass type: 0 - Decryption/Encryption Encrypted Database stored into local storage, 1,2 - Importing/Exporting Encrypted Database from/to file  
  ce_passParam = 0,               // store any data, ce_ecb(ce_passParam);
  ce_epass = 0,                   // pass for encrypt/decrypt encrypted storage
  ce_ipass = 0,                   // pass for encrypt/decrypt when storage is exporting/importing
  ce_ecb = 0;                     // callback func for password manager
  
  function ce_checkPass() {
      
    var passA = $('passA').value, passB = $('passB').value, passC = $('passC').value,
    s0 = 'The password field must match the password confirmation field.',
    s1 = 'Password is too short, it must be 4 characters minimum.',
    s2 = 'Current password is incorrect',
    s3 = 'Decryption failed. Please enter valid password.';
    
    if (passA.length < 4) {
      alert(ce_passType ? (ce_passType == 1 ? s3 : s1) : (opt.p ? (ce_epass ? s2 : s3) : s1));
      $('passA').focus();
      return 0;
    }
    
    // Importing Encrypted Database from a file
    if (ce_passType == 1) {
      ce_ipass = passA;
      passA = '';
      ce_onImport();
      return 1;  
    }
     
    // Exporting Encrypted Database to a file
    else if (ce_passType == 2) {
      if (passA == passB) {
        ce_ipass = passA;
        passA = passB = '';
        ce_onExport();
        return 1;  
      } else
        alert(s0);
    }
    
    // Decryption/Encryption Encrypted Database stored into local storage
    else if (opt.p) {
      // if signed in, change pass
      if (ce_epass) {
        if(passA == ce_epass) {
          if (passB.length > 0) {
            if (passB == passC) {
              ce_epass = passB;
              passA = passB = passC = '';
              ce_saveElist();
              return 1;
            } else
              alert(s0);  
          } else
            alert(s1);  
        } else {
          alert(s2);
        }  
      }
      // sign in
      else {
        ce_epass = passA;
        passA = '';
        ce_getElist();
        return 1;
      }
    }
    // first run / register
    else {
      if (passA == passB) {
        ce_epass = passA;
        passA = passB = '';
        opt.p = 1; // pass is set, save to options
        chrome.runtime.sendMessage(JSON.stringify({id:30,data:opt})); // save options 
        ce_getElist();
        return 1;  
      } else
        alert(s0);  
    }
    return 0;
  };
  
  function ce_onPassOk(e) {
    if (ce_checkPass())
      $('passBox').style.display = 'none';
    e.stopPropagation();
  }
  
  function ce_onPassCancel() {
    ce_ecb = ce_passType = ce_passParam = ce_ipass = 0;
    $('passBox').style.display = 'none';
  }
  
  function ce_promptPass() {
    var passTitle = $('passTitle'), passDesc = $('passDesc'), passLabelA = $('passLabelA'), passLabelB = $('passLabelB'), passLabelC = $('passLabelC');
    $('passA').value = $('passB').value = $('passC').value = '';
    // import/export
    if (ce_passType == 1) {
      passTitle.textContent = 'Restore';
      passDesc.textContent = 'Password required to decrypt backed up file data:'
      passLabelA.textContent = 'Password:';
      passDesc.style.display = '';
      passLabelC.style.display = passC.style.display = passLabelB.style.display = passB.style.display = 'none';  
    }
    // export
    else if (ce_passType == 2) {
      passTitle.textContent = 'Backup';
      passDesc.textContent = 'Please enter a password which will be used to encrypt or decrypt your backup file data:';
      passLabelA.textContent = 'Enter a password:';
      passLabelB.textContent = 'Re-enter password:';
      passLabelB.style.display = passB.style.display = passDesc.style.display = '';
      passLabelC.style.display = passC.style.display = 'none';  
    }
    // first run / register
    else if (!opt.p) {
      passTitle.textContent = 'Get started with Encrypted Database';
      passDesc.textContent = 'Please enter a password which will be used to encrypt or decrypt your cookies. Only someone knowing this password can access and use encrypted cookies. Please note: we cannot recover your password if you lose it, so please ensure you keep it in a safe place.';
      passLabelA.textContent = 'Choose a password:';
      passLabelB.textContent = 'Re-enter password:';
      passLabelB.style.display = passB.style.display = passDesc.style.display = '';
      passLabelC.style.display = passC.style.display = 'none';
    }
    // 
    else {
      // if signed in, change pass
      if (ce_epass) {
        passTitle.textContent = 'Change password';
        passLabelA.textContent = 'Current password:';
        passLabelB.textContent = 'New password:';
        passLabelC.textContent = 'Confirm new password:';
        passDesc.style.display = 'none';
        passLabelC.style.display = passC.style.display = passLabelB.style.display = passB.style.display = '';
      } else { // sign in
        passTitle.textContent = 'Encrypted Storage';
        passDesc.textContent = 'Please enter a password';
        passLabelA.textContent = 'Password:';
        passDesc.style.display = '';
        passLabelC.style.display = passC.style.display = passLabelB.style.display = passB.style.display = 'none';
      }
    }
    
    $('passBox').style.display = 'block';
    $('passA').focus();
  };
    
  function ce_getElist(cb) {  
    if (cb)
      ce_ecb = cb;
      
    if (!ce_epass) {
      ce_offCtrls(true, 1, 0);
      ce_passType = 0; 
      ce_promptPass();
      return;
    }
    
    if (!ce_clist[1]) {
      var s = localStorage.getItem('elist');
      if (s == undefined) {
        ce_clist[1] = [];
        ce_genTree(1, ce_ecb);
      }
      else {
        ce_crypt(s, ce_epass, 8, function(decrypted) {
          if (!decrypted) {
            ce_epass = 0;
            alert('Unable to decrypt database. Please enter valid password.');
            ce_promptPass();
          }
          else {
            var cookies  = ce_parse(decrypted, []);
            for (var i = 0; i < cookies.length; i++) {
              if (cookies[i].domain.charAt(0) == '.')
                cookies[i].host = cookies[i].domain.slice(1);
              else
                cookies[i].host = cookies[i].domain;
            }
            ce_clist[1] = cookies.sort(ce_sortHosts);
            ce_genTree(1, ce_ecb);
          }  
        });
      }
    } else
      if (ce_ecb) ce_ecb();
  };
  
  function ce_saveElist() {
    var list = ce_clist[1], rg = [];
    for (var i = 0; i < list.length; i++) {
      if (!list[i].r)
        rg.push(list[i]);  
    }
    var s = ce_stringify(rg,"[]");
    ce_crypt(s, ce_epass, 7, function(encrypted) {
      localStorage.setItem('elist', encrypted);
    });
  };
  
  // Add cookie(s), [cookies] - array of cookies objects
  function ce_addToElist(cookies) {
    for (var i = 0; i < cookies.length; i++)
      ce_clist[1].push(cookies[i]); // add new
  };
  
  function ce_isElisted(cookie) {
    var c, rg = ce_clist[1];
    for (var i = 0; i < rg.length; i++) {
      c = rg[i];
      if (c.domain == cookie.domain) {
        if (c.name == cookie.name)
          return i;
      }
    }
    return -1;
  };
  
  // id: 7:encrypt 8:decrypt
  function ce_crypt(str, pass, id, cb) {
    var w = new Worker('w.js');
    w.addEventListener('message', function(e) {
      cb(e.data);
    }, !1);
    w.postMessage({id:id, str:str, pass:pass});
  };
  
  // Export Encrypted Database to a file
  function ce_onExport(e) {  
    if (!ce_ipass) {
      ce_passType = 2; 
      ce_promptPass();
      return;
    }
    
    var list = ce_clist[1], rg = [];
    for (var i = 0; i < list.length; i++) {
      if (!list[i].r)
        rg.push(list[i]);  
    }
    var s = ce_stringify(rg,"[]");
    ce_crypt(s, ce_ipass, 7, function(encrypted) {
      ce_ipass = 0;
      ce_saveFile(encrypted, 'cookies.db');
    });
  };
  
  // Import Encrypted Database
  function ce_onImport(e) {
    if (!ce_ipass) {
      ce_passType = 1;
      ce_passParam = e.target.files; 
      ce_promptPass();
      return;
    }
     
    ce_readFile(ce_passParam, function(s) {
      var s0 = 'Decryption failed. The specified file or password is invalid.';
      if (s) {
        ce_crypt(s, ce_ipass, 8, function(decrypted) {
          ce_ipass = 0;
          if (decrypted) { 
            var cookies  = ce_parse(decrypted, 0);
            if (cookies) {
              for (var i = 0; i < cookies.length; i++) {
                if (cookies[i].domain.charAt(0) == '.')
                  cookies[i].host = cookies[i].domain.slice(1);
                else
                  cookies[i].host = cookies[i].domain;
              }
              ce_clist[1] = cookies.sort(ce_sortHosts);
              ce_saveElist();
              ce_genTree(1);
            }
          } else
            alert(s0); 
        });
      } else {
        ce_ipass = 0;
        alert(s0);
      }
    });                 
  };
  
  /// Shared functions - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  
  function ce_readFile(fileList, cb) {
    if (fileList && fileList.length > 0) {
      var reader = new FileReader();
      reader.onerror  = function(e) { cb(0); };
      reader.onabort  = function(e) { cb(0); };
      reader.onload   = function(e) { cb(e.target.result); };
      reader.readAsText(fileList[0]);
    }
    else
      cb(0);
  };
  
  function ce_saveFile(data, fname) {
    var blob,
    contentType = 'text/plain;charset=UTF-8',
    URL = window.webkitURL || window.URL,
    e_link = $('saver');

    if (Blob)
      blob = new Blob([data], {type: contentType});
    else if (BlobBuilder) {
      var bb = new BlobBuilder();
      bb.append(data);
      blob = bb.getBlob(contentType);
    }
    
    e_link.href = URL.createObjectURL(blob);
    e_link.setAttribute('download', fname);
    e_link.click();
    
    setTimeout(function() {
      URL.revokeObjectURL(e_link.href);
      shade(0,0);
    }, 2000);
  };
  
  function ce_parse(jstr, def) {
    if (!jstr) return def;
    var js; try { js = JSON.parse(jstr);} catch(e) { js = def; } return js;
  };
  
  function ce_stringify(js, def) {
    var jstr; try { jstr = JSON.stringify(js); } catch(e) { jstr = def; } return jstr;
  };
  
  function ce_nextNode(node) {
    var next = node.nextElementSibling;
    if (next)
      return next.nextElementSibling;
    return 0; 
  }
  
  function ce_prevNode(node) {
    var prev = node.previousElementSibling;
    if (prev)
      return prev.previousElementSibling;
    return 0; 
  };
  
  function ce_extID() {
    var url = chrome.runtime.getURL('');
    return url.slice(19, url.length-1);
  };
  
  function $(id) {
    return document.getElementById(id);  
  };

})();