/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */
 
jQuery.cookie=function(b,j,m){if(typeof j!="undefined"){m=m||{};if(j===null){j="";m.expires=-1}var e="";if(m.expires&&(typeof m.expires=="number"||m.expires.toUTCString)){var f;if(typeof m.expires=="number"){f=new Date();f.setTime(f.getTime()+(m.expires*24*60*60*1000))}else{f=m.expires}e="; expires="+f.toUTCString()}var l=m.path?"; path="+(m.path):"";var g=m.domain?"; domain="+(m.domain):"";var a=m.secure?"; secure":"";document.cookie=[b,"=",encodeURIComponent(j),e,l,g,a].join("")}else{var d=null;if(document.cookie&&document.cookie!=""){var k=document.cookie.split(";");for(var h=0;h<k.length;h++){var c=jQuery.trim(k[h]);if(c.substring(0,b.length+1)==(b+"=")){d=decodeURIComponent(c.substring(b.length+1));break}}}return d}};

/**
 * Module to show Recently Viewed Products
 *
 * Copyright (c) 2014 Caroline Schnapp (11heavens.com)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */
 
 Shopify.Products = (function() {

   var config = { 
     howManyToShow: 3,
     howManyToStoreInMemory: 10, 
     wrapperId: 'recently-viewed-products', 
     templateId: 'recently-viewed-product-template',
     onComplete: null
   };
   
   var productHandleQueue = [];
   var wrapper = null;
   var template = null;
   var shown = 0;

   var cookie = {
     configuration: {
       expires: 90,
       path: '/',
       domain: window.location.hostname
     },
     name: 'shopify_recently_viewed',
     write: function(recentlyViewed) {
       jQuery.cookie(this.name, recentlyViewed.join(' '), this.configuration);
     },
     read: function() {
       var recentlyViewed = [];
       var cookieValue = jQuery.cookie(this.name);
       if (cookieValue !== null) {
         recentlyViewed = cookieValue.split(' ');
       }
       return recentlyViewed;        
     },
     destroy: function() {
       jQuery.cookie(this.name, null, this.configuration);
     },
     remove: function(productHandle) {
       var recentlyViewed = this.read();
       var position = jQuery.inArray(productHandle, recentlyViewed);
       if (position !== -1) {
         recentlyViewed.splice(position, 1);
         this.write(recentlyViewed);
       }       
     }
   };
   
   var finalize = function() {
     wrapper.show();
     // If we have a callback.
     if (config.onComplete) {
       try { config.onComplete() } catch (error) { }
     }  
   };
   
   var moveAlong = function() {
     if (productHandleQueue.length && shown < config.howManyToShow) {
       jQuery.ajax({
         dataType: 'json',
         url: '/products/' + productHandleQueue[0] + '.js',
         cache: false,
         success: function(product) {
           template.tmpl(product).appendTo(wrapper); 
           productHandleQueue.shift();
           shown++;
           moveAlong();
         },
         error: function() {
           cookie.remove(productHandleQueue[0]);
           productHandleQueue.shift();
           moveAlong();
         }
       });
     }
     else {
       finalize();
     }
     
   };
   
   return {

     showRecentlyViewed: function(params) {

       var params = params || {};

       // Update defaults.
       jQuery.extend(config, params);

       // Read cookie.
       productHandleQueue = cookie.read();
       
       // Template and element where to insert.
       template = jQuery('#' + config.templateId);
       wrapper = jQuery('#' + config.wrapperId);
       
       // How many products to show.
       config.howManyToShow = Math.min(productHandleQueue.length, config.howManyToShow);

       // If we have any to show.
       if (config.howManyToShow && template.length && wrapper.length) {
         // Getting each product with an Ajax call and rendering it on the page.
         moveAlong();    
       }

     },

     getConfig: function() {
       return config;
     },

     clearList: function() {
       cookie.destroy();      
     },
     
     recordRecentlyViewed: function(params) {

       var params = params || {};

       // Update defaults.
       jQuery.extend(config, params);

       // Read cookie.
       var recentlyViewed = cookie.read();

       // If we are on a product page.
       if (window.location.pathname.indexOf('/products/') !== -1) {

         // What is the product handle on this page.
         var productHandle = window.location.pathname.match(/\/products\/([a-z0-9\-]+)/)[1];
         // In what position is that product in memory.
         var position = jQuery.inArray(productHandle, recentlyViewed);
         // If not in memory.
         if (position === -1) {
           // Add product at the start of the list.
           recentlyViewed.unshift(productHandle);
           // Only keep what we need.
           recentlyViewed = recentlyViewed.splice(0, config.howManyToStoreInMemory);
         }
         else {
           // Remove the product and place it at start of list.
           recentlyViewed.splice(position, 1);
           recentlyViewed.unshift(productHandle);              
         }

         // Update cookie.
         cookie.write(recentlyViewed);

       }
       
     }

   };

 })();