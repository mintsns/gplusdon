//===========================================================================
//
//  Vue component define body
//
//===========================================================================

//===----------------------------------------------------------------------===
//  Component: timeline-toot
//===----------------------------------------------------------------------===
Vue.component("timeline-toot", {
	template: CONS_TEMPLATE_TOOTBODY,
	
	props: {
		translation: Object,
		globalinfo: Object,
		comment_viewstyle : {
			type : Object,
			default : null
		},
		comment_list_area_viewstyle : {
			type : Object,
			default : null
		},
		content_body_style : {
			type : Object,
			default : null,
		},
		popuping : {
			type : String,
			default : ""
		},
		/**
		 * Each element's css style JSON
		 */
		datastyle : {
			type : Object,
			default : null
		},
		toote: {
			type : Object,
			default : null
		}
	},
	data(){
		return {
			toot_body_stat : {
				"sizing-min" : false,
				"sizing-mid" : false,
				"sizing-max" : false,
				"sizing-fullmax" : false,
			},
			isfirst : true,
			issinglewindow : false,
            first_comment_stat : {
				close : true,
                mini : false,
                open : false,
                full : false
			},
			comment_stat : {
				close : true,
                mini : false,
                open : false,
                full : false
			},
			comment_list_area_stat : {
				default : true
			},
			elementStyle : {
				"comment-list" : {
					sizing : true
				},
				"toot_avatar_imgsize" : "32px"

			},
			isshow_replyinput : false,
			reply_to_id : "",
			mention_to_id : "",
			
			//---share scope box and mention box data
            sharescopes : [
                {text : _T("sel_tlpublic"), value: "tt_public", avatar: "public", selected:{"red-text":true}},
                {text : _T("sel_tlonly"),   value: "tt_tlonly", avatar: "lock_open",selected:{"red-text":false}},
                {text : _T("sel_private"),  value: "tt_private", avatar: "lock",selected:{"red-text":false}},
            ],
			selsharescope : {
				text : _T("sel_tlpublic"),
				value : "tt_public",
				avatar : "public",
				selected:{"red-text":true}
			},

			//---reaction dialog: favorite, boost
			is_reactiondialog : false,
			reaction_dialog_title : "",
			reaction_info : {
				max_id : "",
				since_id : "",
			},
			reaction_accounts : []
		};
    },
    watch:  {
        status_text : function(val) {
            var mentions = this.calc_mentionLength(this.selmentions).join(" ");
            var tags = this.seltags.join(" ");
            this.strlength = twttr.txt.getUnicodeTextLength(val)
                + mentions.length + tags.length;
            
        },
    },
	computed: {
		tootElementId: function () {
            if ("body" in this.toote) {
                return this.popuping + "toot_" + this.toote.id;
            }
		},
		isBoostable : function () {
			let boostable = [
				"private", "direct"
			];
			if (boostable.indexOf(this.toote.body.visibility) > -1) {
				return true;
			}else{
				return false;
			}
		},
		favourite_type : function() {
			return _T("favourite_"+MYAPP.session.config.application.showMode);
		},
		favourite_icon : function () {
			if (MYAPP.session.config.application.showMode == "gplus") {
				return "plus_one";
			}else if (MYAPP.session.config.application.showMode == "twitter") {
				return "favorite";
			}else{
				return "star";
			}
		},
		reblog_type : function() {
			return _T("reblog_"+MYAPP.session.config.application.showMode);
		},

	},
	beforeMount(){

		//---from commonvue.tootcard
		if (!this.datastyle) {
			this.elementStyle = Object.assign({},this.datastyle);
		}
		if (this.comment_viewstyle) {
			for (var obj in this.comment_stat) {
				this.comment_stat[obj] = this.comment_viewstyle[obj];
				this.first_comment_stat[obj] = this.comment_viewstyle[obj];
			}
			this.isshow_replyinput = true;
			this.issinglewindow = true;
		}
		if (this.comment_list_area_viewstyle) {
			this.comment_list_area_stat.default = this.comment_list_area_viewstyle.default;
		}
		
	},
	mounted(){
		//console.log("created html=",this.toote.body.html)
		if ("body" in this.toote) {
			var pcnt = this.toote.body.html.match(/<p/g) || [];
			var brcnt = this.toote.body.html.match(/<br/g) || [];
			var fnlcnt = pcnt.length + brcnt.length;
			//console.log("created cnt=",pcnt,brcnt);
			if ((fnlcnt < 3) && (this.toote.body.content.length < 40)) {
				this.toot_body_stat["sizing-min"] = true;
			}else if ((fnlcnt < 5)) {
				if ((checkRange(1,this.toote.body.content.length,100))) {
					this.toot_body_stat["sizing-mid"] = true;
				}else{
					this.toot_body_stat["sizing-max"] = true;
				}
			}else{
				this.toot_body_stat["sizing-max"] = true;
			}
		}
		//console.log(this.$el);
		/*var es = this.$el.querySelectorAll(".carousel");
		console.log(es.length);
		for (var i = 0; i < es.length; i++) {
			M.Carousel.init(es[i], {
				dist: 0,
				fullWidth: true,
				indicators: true
			});
		}*/
		jQuery.timeago.settings.cutoff = (1000*60*60*24) * 3;
		$("time.timeago").timeago();
	},
	updated(){
		if (this.isfirst) {
			if (this.toote.descendants.length > 0) {
				this.comment_stat.mini = true;
				this.comment_stat.close = false;
				this.first_comment_stat.mini = true;
				this.first_comment_stat.close = false;

				if (this.comment_viewstyle) {
					for (var obj in this.comment_stat) {
						this.comment_stat[obj] = this.comment_viewstyle[obj];
						this.first_comment_stat[obj] = this.comment_viewstyle[obj];
					}
					this.isshow_replyinput = true;
				}
			}
			this.isfirst = false;
		}
		if (this.comment_list_area_viewstyle) {
			this.comment_list_area_stat.default = this.comment_list_area_viewstyle.default;
		}
		if (this.content_body_style) {
			this.toot_body_stat["sizing-fullmax"] = true;
		}
	},
	methods: {
        //---some function----------------------------------------
		replyElementId: function (reply) {
			return this.popuping + "reply_" + reply.id;
		},
		generateReplyObject: function (reply){
			var selac = MYAPP.session.status.selectedAccount;
			var data = {
				reply_to_id : reply.body.id,
				reply_account : reply.account,
				selectaccount : `${selac.idname}@${selac.instance}`
			};
			return data;
		},
		favourite_reaction_msg : function() {
			return _T("msg_reaction_fav_"+MYAPP.session.config.application.showMode);
		},
		reblog_reaction_msg : function() {
			return _T("msg_reaction_bst_"+MYAPP.session.config.application.showMode);
		},

		//---event handler----------------------------------------
		onclick_toot_ancestor : function (e) {
			var ans = this.toote.ancestors[this.toote.ancestors.length-1];

			MYAPP.commonvue.tootecard.status = ans;
			MYAPP.commonvue.tootecard.is_overlaying = true;
			//---change URL
			if (MUtility.checkRootpath(location.pathname,MYAPP.session.status.currentLocation) == -1) {
				MUtility.returnPathToList(MYAPP.session.status.currentLocation);
			}
			var targetpath = "";
			var changeuri = ans.body.uri.replace("https://","");
			changeuri = changeuri.replace("statuses","toots");
			changeuri = changeuri.replace("users/","");
			//---when each screen existable toot
			targetpath = `/users/${changeuri}`;
			MUtility.enterFullpath(targetpath);
		},
        onclick_tt_datetime: function (e) {
			console.log(e);
			/*if (MYAPP.commonvue.tootecard.is_overlaying === true) {
				MYAPP.commonvue.tootecard.is_overlaying = false;
				return;
			}*/
			/*var target = e.target.parentElement.parentElement.parentElement.parentElement;
			if (target.parentElement.classList.contains("onetoote_area")) {
				return;
			}*/
			//---save insertion point element for clicking target element
			/*MYAPP.session.status.pickupToote = target.nextElementSibling;
			MYAPP.session.status.pickupDir = "next";
			if (!target.nextElementSibling) {
				MYAPP.session.status.pickupToote = target.previousElementSibling;
				MYAPP.session.status.pickupDir = "prev";
			}
			MYAPP.session.status.pickupObjectToot = this;
			*/
			if (this.issinglewindow) return;

			//======old: the element moving mode
			//---refer to destination parent 
			//var dest = Q("div.onetoote_area");
            //dest.appendChild(target);
			//======new: Vue data format mode
			MYAPP.commonvue.tootecard.status = null;
			MYAPP.commonvue.tootecard.status = this.toote;
			MYAPP.commonvue.tootecard.comment_list_area_viewstyle.default = false;


			//---change each states
			///Q("div.onetoote_screen").classList.toggle("common_ui_off");
			MYAPP.commonvue.tootecard.sizing_window();
			MYAPP.commonvue.tootecard.is_overlaying = true;

            //return;
			//dest.classList.toggle("common_ui_off");
			//console.log(target.querySelector(".toot_comment"));
			//this.toot_body_stat["sizing-max"] = !this.toot_body_stat["sizing-max"];
			//this.toot_body_stat["sizing-fullmax"] = !this.toot_body_stat["sizing-fullmax"];

			//---setup media
			/*if (target.querySelector(".card-image .carousel")) {
				target.querySelector(".card-image .carousel").classList.toggle("fullsize");
			}*/
			//---setup comment
			/*var toot_comment = target.querySelector(".toot_comment");
			if (toot_comment) {
				//toot_comment.classList.toggle("full");
				//toot_comment.classList.remove("open");
                //toot_comment.classList.remove("mini");
                this.comment_stat.full =  true;
                this.comment_stat.mini =  false;
                this.comment_stat.open =  false;
				target.querySelector(".toot_comment .collection").classList.toggle("sizing");
			}*/
			//---change URL
			if (MUtility.checkRootpath(location.pathname,MYAPP.session.status.currentLocation) == -1) {
				MUtility.returnPathToList(MYAPP.session.status.currentLocation);
			}
			var targetpath = "";
			var changeuri = this.toote.body.uri.replace("https://","");
			changeuri = changeuri.replace("statuses","toots");
			changeuri = changeuri.replace("users/","");
			//---when each screen existable toot
			if (MYAPP.session.status.currentLocation.indexOf("/tl") > -1) {
				//targetpath = `/users/${this.toote.account.instance}/${this.toote.account.username}/toots/${this.toote.id}`;
				targetpath = `/users/${changeuri}`;
			}else if (MYAPP.session.status.currentLocation.indexOf("/users") > -1) {
				targetpath = `/users/${changeuri}`;
			}else if (MYAPP.session.status.currentLocation.indexOf("/accounts") > -1) {
				targetpath = `/accounts/${changeuri}`;
			}
			MUtility.enterFullpath(targetpath);
	
		},
		onclick_morevert: function (e) {
			var parent = e.target.parentElement.parentElement.parentElement;
			if (e.target.tagName.toLowerCase() == "i") {
				parent = e.target.parentElement.parentElement.parentElement.parentElement;
			}
			//console.log(e.target, e.target.parentElement, e.target.parentElement.parentElement, parent);
			var target = parent.querySelector(".card-userreveal");
			var userid = parent.querySelector("input[name='userid']");
			//console.log(target, userid);
			if (this.toote.relationship.isme) {
				target.classList.add("is-veal");
				target.classList.remove("un-veal");
			}else{
				MYAPP.sns.getRelationship(userid.value)
				.then((data) => {
					for (var i = 0; i < data.data.length; i++) {
						for (var obj in data.data[i]) {
							this.toote.relationship[obj] = Object.assign({}, data.data[i][obj]);
						}
					}
					target.classList.add("is-veal");
					target.classList.remove("un-veal");
				});
			}
		},
		onclick_vealclose: function (e) {
			var parent = e.target.parentElement.parentElement.parentElement;
			if (e.target.tagName.toLowerCase() == "i") {
				parent = e.target.parentElement.parentElement.parentElement.parentElement;
			}
			var target = parent.querySelector(".card-userreveal");
			target.classList.remove("is-veal");
			target.classList.add("un-veal");
		},
		onclick_ttbtn_reply: function (e) {
			//console.log(e);
			var target = e.target.parentElement.parentElement.nextElementSibling;
			var rootParent = e.target.parentElement.parentElement.parentElement;

			//---change view styles
			if (this.comment_stat.full) {
				//return;
			}else{
				if (this.first_comment_stat.close) {
					this.comment_stat.close = !this.comment_stat.close;
					this.comment_stat.open = !this.comment_stat.open;	

				}
				if (this.first_comment_stat.mini) {
					this.comment_stat.mini = !this.comment_stat.mini;
					this.comment_stat.open = !this.comment_stat.open;	
				}
				//target.classList.toggle("mini");
				//if (!target.classList.contains("full")) {
				//	target.classList.toggle("open");
				//}
				var num_row = parseInt(rootParent.style.gridRowEnd.replace("span", ""));
				//if (target.classList.contains("mini")) {
				if (this.comment_stat.mini) {
					num_row = num_row -4;
					rootParent.style.gridRowEnd = `span ${num_row}`;
				//} else if (target.classList.contains("open")) {
				}else if (this.comment_stat.close) {
					num_row = num_row - 4;
					rootParent.style.gridRowEnd = `span ${num_row}`;
				}else if (this.comment_stat.open) {
					num_row = num_row + 4;
					rootParent.style.gridRowEnd = `span ${num_row}`;
				}
			}

			if (this.comment_stat.open || this.comment_stat.full) {
				MYAPP.sns.getConversation(this.toote.id, this.toote.id, "")
				.then((condata) => {
					var tt = this.toote; //this.getParentToot(condata.parentID);
					for (var a = 0; a < condata.data.ancestors.length; a++) {
						var ance = condata.data.ancestors[a];
						var gcls = new Gpstatus(ance,14);

						condata.data.ancestors[a] = gcls;

					}
					for (var a = 0; a < condata.data.descendants.length; a++) {
						var desce = condata.data.descendants[a];
						var gcls = new Gpstatus(desce,14);


						condata.data.descendants[a] = gcls;
					}
					//this.toote.comment_stat.mini = condata.data.descendants.length == 0 ? false : true;

					if ((tt) && ((condata.data.ancestors.length > 0) || (condata.data.descendants.length > 0))) {
						this.toote.ancestors.splice(0,this.toote.ancestors.length);
						this.toote.descendants.splice(0,this.toote.descendants.length);
						this.toote.ancestors = this.toote.ancestors.concat(condata.data.ancestors);
						this.toote.descendants = this.toote.descendants.concat(condata.data.descendants);
						this.toote.body.replies_count = condata.data.descendants.length;
						if (!this.comment_stat.full) {
							this.first_comment_stat.close = false;
							this.first_comment_stat.mini = true;
							this.comment_stat.mini = false;
							this.comment_stat.open = true;
								this.$nextTick(function () {
								return;
							});
						}
					}
					return condata;
				})
				.then((result)=> {
					

					var basetoote = this.toote;
					for (var i = 0; i < basetoote.descendants.length; i++) {
						var toote = basetoote.descendants[i];
						if (("relationship" in toote) && ("following" in toote.relationship)) {
							
						}else{
							MYAPP.sns.getRelationship(toote.account.id)
							.then((result) => {
								for (var i = 0; i < result.data.length; i++) {
									for (var obj in result.data[i]) {
										toote.relationship[obj] = Object.assign({}, result.data[i][obj]);
									}
								}
							});
						}
					}

				})
				.finally( () => {
					//e.target.classList.toggle("lighten-3");
					//this.isshow_replyinput = !this.isshow_replyinput;
					//target.querySelector("div.template_reply_box").classList.toggle("common_ui_off");	
				});
			}
			e.target.classList.toggle("lighten-3");
			this.isshow_replyinput = !this.isshow_replyinput;
			

		},
		onclick_ttbtn_fav: function(e) {
			var mainfunc = () => {
				//console.log("target=",e.target);
				e.target.parentElement.classList.add("pulse");
				MYAPP.sns.setFav(this.toote.id, !this.toote.body.favourited, {api:{},app:{}})
				.then(result=>{
					e.target.parentElement.classList.remove("pulse");
					//console.log("fav after=",result);
					this.toote.body.favourites_count = result.favourites_count;
					//---change color for favourited state.
					this.toote.reactions.fav["lighten-3"] = result.favourited ? false : true;
				});
			};
			//console.log("onclick_ttbtn_fav=",e,JSON.original(this.toote),!this.toote.body.favourited);
			if (MYAPP.session.config.action.confirmBefore) {
				var msg = _T("msg_confirm_fav_"+MYAPP.session.config.application.showMode);
				appConfirm(msg,mainfunc);
			}else{
				mainfunc();
			}
		},
		onclick_ttbtn_bst: function(e) {
			var mainfunc = () => {
				//console.log("target=",e.target);
				e.target.parentElement.classList.add("pulse");
				MYAPP.sns.setBoost(this.toote.id, !this.toote.body.reblogged, {api:{},app:{}})
				.then(result=>{
					e.target.parentElement.classList.remove("pulse");
					//console.log("bst after=",result);
					this.toote.body.reblogs_count = this.toote.body.reblogs_count + result.reblogs_count;
					//---change color for favourited state.
					this.toote.reactions.reb["lighten-3"] = result.reblogged ? false : true;
				});
			};
			//console.log("onclick_ttbtn_bst=",e,JSON.original(this.toote),!this.toote.body.favourited);
			if (MYAPP.session.config.action.confirmBefore) {
				var msg = _T("msg_confirm_bst_"+MYAPP.session.config.application.showMode);
				appConfirm(msg,mainfunc);
			}else{
				mainfunc();
			}
		},
		onclick_reaction_fav : function (toote) {
			this.reaction_dialog_title = this.favourite_reaction_msg();
			MYAPP.sns.getFavBy(toote.body.id,{
				api : {},
				app : {}
			},"")
			.then(result => {
				//console.log("result.data=",result.data);
				this.reaction_accounts.splice(0,this.reaction_accounts.length);
				for (var i = 0; i < result.data.length; i++) {
					this.reaction_accounts.push(result.data[i]);
				}
				this.is_reactiondialog = !this.is_reactiondialog;
			});
		},
		onclick_reaction_bst : function (e) {
			this.reaction_dialog_title = this.reblog_reaction_msg();
			MYAPP.sns.getBoostBy(this.toote.body.id,{
				api : {},
				app : {}
			},"")
			.then(result => {
				this.reaction_accounts.splice(0,this.reaction_accounts.length);
				for (var i = 0; i < result.data.length; i++) {
					this.reaction_accounts.push(result.data[i]);
				}
				this.is_reactiondialog = !this.is_reactiondialog;
			});
		},
		/*onfocus_dv_inputcontent: function (e) {
			e.target.nextElementSibling.classList.remove("common_ui_off");
		},
		onclick_btn_reply_each: function (e) {
			var elem_reply_box = e.target.parentElement.parentElement.previousElementSibling;
			var target = elem_reply_box.querySelector(".dv_inputcontent");
			console.log(elem_reply_box);
			console.log(elem_reply_box);
			target.innerHTML = target.innerHTML + "<a href=#!>@hoge</a>&nbsp;";
		},*/
		onenter_avatar: function (e) {
			var parent = e.target.parentElement;
			var userid = parent.querySelector("input[name='sender_id']");
			var toote = null;
			if (userid.alt == "thistoot") {
				toote = this.toote;
			}else if (userid.alt == "boost") {
				toote = this.toote.reblogOriginal;
			}else if (userid.alt == "parent") {
				toote = this.toote.ancestors[this.toote.ancestors.length-1];
			}else if (userid.alt == "reply") {
				toote = this.toote.descendants[Number(userid.title)];
			}else if (userid.alt == "reaction") {
				var sindex = parent.querySelector("input[name='sender_index']").value;
				//console.log(this.reaction_accounts[sindex]);
				toote = {
					"account": this.reaction_accounts[sindex],
					"relationship" : {

					}
				}
			}else{
				return;
			}

			//console.log(e,parent,userid);
			if (("relationship" in toote) && ("following" in toote.relationship)) {
				MYAPP.showUserCard(e.currentTarget.getBoundingClientRect(), 
					JSON.original({
						"account" : toote.account,
						"relationship" : toote.relationship,
					})
				);
			}else{
				var hit = MYAPP.userstore.getIndex({
					username : toote.account.username,
					instance : toote.account.instance
				});
				if (hit > -1) {
					var hitdata = MYAPP.userstore.items[hit];
					for (var obj in hitdata.relationship) {
						toote.relationship[obj] = hitdata.relationship[obj];
					}
					MYAPP.showUserCard(e.target.getBoundingClientRect(), hitdata);
				}else{
					MYAPP.sns.getRelationship(userid.value)
					.then((result) => {
						for (var i = 0; i < result.data.length; i++) {
							for (var obj in result.data[i]) {
								toote.relationship[obj] = result.data[i][obj];
							}
						}
						MYAPP.userstore.add({
							account : toote.account,
							relationship : toote.relationship
						});
						//console.log(JSON.original(toote));
						MYAPP.showUserCard(e.target.getBoundingClientRect(), 
							JSON.original({
								"account" : toote.account,
								"relationship" : toote.relationship,
							})
						);
					});
				}
			}
		},
		onclick_comment_to_reply: function (index) {
			if (!checkRange(0,index,this.toote.descendants.length-1)) return;
			var des = this.toote.descendants[index];
			this.reply_to_id = des.body.id;
			this.mention_to_id = des.account.id;
			var editor = CKEDITOR.instances[this.popuping + "replyinput_"+this.toote.body.id];
			editor.editable().editor.insertText("@"+des.account.acct);
			this.status_text = "@"+des.account.acct; 
		},
		onclick_fav_to_reply: function (e) {
			var tgt = e.target;
			if (e.target.tagName.toLowerCase() == "i") {
				tgt = e.target.parentElement;
			}
			//console.log(tgt,tgt.getAttribute("data-index"));
			var index = Number(tgt.getAttribute("data-index"));

			if (!checkRange(0,index,this.toote.descendants.length-1)) return;
			var des = this.toote.descendants[index];
			
			var mainfunc = () => {
				tgt.classList.add("pulse");
				MYAPP.sns.setFav(des.body.id, !des.body.favourited, {api:{},app:{}})
				.then(result=>{
					tgt.classList.remove("pulse");
					//console.log("fav after=",result);
					des.body.favourites_count = result.favourites_count;
					//---change color for favourited state.
					des.reactions.fav["lighten-3"] = result.favourited ? false : true;
				});
			};
			//console.log("onclick_ttbtn_fav=",e,JSON.original(des),!des.body.favourited);
			if (MYAPP.session.config.action.confirmBefore) {
				var msg = _T("msg_confirm_fav_"+MYAPP.session.config.application.showMode);
				appConfirm(msg,mainfunc);
			}else{
				mainfunc();
			}

		},
		onclick_bst_to_reply: function(e) {
			var tgt = e.target;
			if (e.target.tagName.toLowerCase() == "i") {
				tgt = e.target.parentElement;
			}
			var index = Number(tgt.getAttribute("data-index"));

			if (!checkRange(0,index,this.toote.descendants.length-1)) return;
			var des = this.toote.descendants[index];

			var mainfunc = () => {
				tgt.classList.add("pulse");
				MYAPP.sns.setBoost(des.body.id, !des.body.reblogged, {api:{},app:{}})
				.then(result=>{
					tgt.classList.remove("pulse");
					//console.log("bst after=",result);
					des.body.reblogs_count = result.reblogs_count;
					//---change color for favourited state.
					des.reactions.reb["lighten-3"] = result.reblogged ? false : true;
				});
			};
			//console.log("onclick_ttbtn_bst=",e,JSON.original(des),!des.body.favourited);
			if (MYAPP.session.config.action.confirmBefore) {
				var msg = _T("msg_confirm_bst_"+MYAPP.session.config.application.showMode);
				appConfirm(msg,mainfunc);
			}else{
				mainfunc();
			}
		},
		onclick_toote_pinn : function (toote) {
			var mainfunc = () => {
				MYAPP.sns.setPin(toote.body.id, !toote.body.pinned)
				.then(result=>{
					console.log("bst after=",result);
					toote.body.pinned = !toote.body.pinned;
				});
			};
			if (MYAPP.session.config.action.confirmBefore) {
				var msg = "";
				if (toote.body.pinned) {
					msg = _T("msg_confirm_unpin");
				}else{
					msg = _T("msg_confirm_pin");
				}
				appConfirm(msg,mainfunc);
			}else{
				mainfunc();
			}
		},
		onclick_toote_delete : function (toote,commentIndex) {
			var mainfunc = () => {
				console.log("target=",toote,commentIndex);
				MYAPP.sns.deleteStatus(toote.body.id)
				.then(result=>{
					console.log("del after=",result);
					if (commentIndex > -1) {
						//---if comment, delete this in here
						this.toote.descendants.splice(commentIndex,1);
						if (this.toote.descendants.length < 1) {
							this.comment_stat.close = true;
							this.comment_stat.mini = false;
							this.comment_stat.open = false;
						}
					}else{
						//---if toot own, to connect to parent component
						this.$emit("delete_toot",toote.body.id);
					}
				});
			};
			if (MYAPP.session.config.action.confirmBefore) {
				var msg = _T("msg_delete_toot");
				appConfirm(msg,mainfunc);
			}else{
				mainfunc();
			}
		},
		onclick_toote_mute : function (toote, commentIndex) {
			var mainfunc = () => {
				console.log("target=",toote,commentIndex);
				MYAPP.sns.setMute(toote.body.id, !toote.body.muted)
				.then(result=>{
					console.log("mute after=",result);
					if (commentIndex > -1) {
						//---if comment, delete this in here
						
					}else{
						//---if toot own, to connect to parent component
						this.$emit("mute_toot",toote.body.muted);
					}
				});
			};
			if (MYAPP.session.config.action.confirmBefore) {
				var msg;
				if (toote.body.muted) {
					msg = _T("msg_confirm_unmute");
				}else{
					msg = _T("msg_confirm_mute");
				}
				appConfirm(msg,mainfunc);
			}else{
				mainfunc();
			}
		},
		onclick_user_mute : function (user, commentIndex) {
			var mainfunc = () => {
				console.log("target=",user,commentIndex);
				MYAPP.sns.setMuteUser(user.id, !user.relationship.muted)
				.then(result=>{
					console.log("mute after=",result);
					if (commentIndex > -1) {
						//---if comment, delete this in here
						
					}else{
						//---if toot own, to connect to parent component
						this.$emit("mute_user",result.muting);
					}
				});
			};
			if (MYAPP.session.config.action.confirmBefore) {
				var msg;
				if (user.relationship.muting) {
					msg = _T("msg_confirm_unmute");
				}else{
					msg = _T("msg_confirm_mute");
				}
				appConfirm(msg,mainfunc);
			}else{
				mainfunc();
			}
		},
		onclick_user_block : function (user, commentIndex) {
			var mainfunc = () => {
				console.log("target=",user,commentIndex);
				MYAPP.sns.setBlockUser(user.id, !user.relationship.blocking)
				.then(result=>{
					console.log("block after=",result);
					if (commentIndex > -1) {
						//---if comment, delete this in here
						
					}else{
						//---if toot own, to connect to parent component
						this.$emit("block user",result.blocking);
					}
				});
			};
			if (MYAPP.session.config.action.confirmBefore) {
				var msg;
				if (user.relationship.blocking) {
					msg = _T("msg_confirm_unblock");
				}else{
					msg = _T("msg_confirm_block");
				}
				appConfirm(msg,mainfunc);
			}else{
				mainfunc();
			}
		},
		onclick_user_endorse : function (user, commentIndex) {
			var mainfunc = () => {
				console.log("target=",user,commentIndex);
				var isendorse = false;
				//---for example, pawoo.net don't has "endorsed" 
				if ("endorsed" in user.relationship) {
					isendorse = user.relationship.endorsed;
				}
				MYAPP.sns.setPinUser(user.id, !isendorse)
				.then(result=>{
					console.log("endorse after=",result);
					if (commentIndex > -1) {
						//---if comment, delete this in here
						
					}else{
						//---if toot own, to connect to parent component
						this.$emit("endorse user",result);
					}
				});
			};
			if (MYAPP.session.config.action.confirmBefore) {
				var msg;
				if (user.relationship.blocking) {
					msg = _T("msg_confirm_unendorse");
				}else{
					msg = _T("msg_confirm_endorse");
				}
				appConfirm(msg,mainfunc);
			}else{
				mainfunc();
			}
		},
		onclick_user_report : function (user, toot, commentIndex) {
			var mainfunc = () => {
				console.log("target=",user,commentIndex);
				MYAPP.sns.setReportUser(user.id,[toot.id],)
				.then(result=>{
					console.log("block after=",result);
					if (commentIndex > -1) {
						//---if comment, delete this in here
						
					}else{
						//---if toot own, to connect to parent component
						this.$emit("block user",result.blocking);
					}
				});
			};
			//TODO: create report dialog !!!
			if (MYAPP.session.config.action.confirmBefore) {
				var msg;
				msg = _T("msg_confirm_report");
				appConfirm(msg,mainfunc);
			}else{
				mainfunc();
			}
		},
		onmouseenter_gifv : function (e) {
			var pro = e.target.play();
			if (pro !== undefined) {
				pro.then(()=>{
					console.log("play");
				}).catch(error=>{
					console.log(error);
				});
			}
		},
		onmouseleave_gifv : function (e) {
			e.target.pause();
		},
		/**
		 * Fire event for replied a post. to connect to parent component
		 * @param {Event} e event object
		 */
		onreplied_post : function (e) {
			this.first_comment_stat.mini = true;
			this.first_comment_stat.close = false;
			this.comment_stat.mini = true;
			this.comment_stat.close = false;
			this.comment_stat.open = false;
			this.toote.body.replies_count++;
			//this.$el.querySelector("div.template_reply_box").classList.toggle("common_ui_off");
			this.$emit('replied_post');
		}
	}
});
//===----------------------------------------------------------------------===
//  Component: user-popupcard
//===----------------------------------------------------------------------===
Vue.component("user-popupcard", {
	template: CONS_TEMPLATE_USERPOPUP,
	props: {
		cardtype: String,	//normal, selectable
		translation: Object,
		account: Object,
		relationship : Object,
		globalinfo: Object
	},
	data() {
		return {
			stat : {
				selected : false,
				isshow_listmenu : false,
			},
			listmenu : {
				x : 0,
				y : 0
			}
		}
	},
	methods: {
		generate_userlink: function (data) {
			return `${this.globalinfo.firstPath}/users/${data.instance}/${data.username}`;
		},
		generate_userDisplayName(data) {
			//console.log("345行目：", data);
			var tmpname = data.display_name == "" ? data.username : data.display_name;
			if (tmpname == null) return "";
			tmpname = MUtility.replaceEmoji(tmpname, data.instance, data.emojis, 18);
			return tmpname;
		},
		generate_userNote(data) {
			var tmpname = data.note;
			if (tmpname == null) return "";
			tmpname = MUtility.replaceEmoji(tmpname, data.instance, data.emojis, 14);
			return tmpname;
		},
		showRelationshpText : function(){
			if (this.relationship.followed_by) {
				return _T("to_followed_by");
			}
		},
		oncheck_following : function (e) {
			var msg = "";
			//---this stat is future stat.
			if (this.relationship.following) {
				msg = _T("msg_confirm_follow",[this.account.display_name]);
			}else{
				msg = _T("msg_confirm_unfollow",[this.account.display_name]);
			}
			appConfirm(msg,(a) =>{
				//appAlert("god!");
				//this.stat.following = true;
				MYAPP.sns.setFollow(this.account.id,this.relationship.following)
				.then(result=>{

				});
			},()=>{
				this.relationship.following = !this.relationship.following;
			});
		},
		oncheck_selectable : function (e) {
			console.log(this.account.id,this.stat.selected);
			this.$emit('check_selectable',{userid:this.account.id,checked:this.stat.selected});
		},
		onclick_removelist : function (index) {
			var msg = _T("msg_del_to_list",[this.account.display_name,this.account.lists[index].title]);
			appConfirm(msg,()=>{
				MYAPP.sns.removeMemberFromList(this.account.lists[index].id,[this.account.id])
				.then(result=>{
					this.account.lists.splice(index,1);
				});
			});
		},
		onhover_b : function(e) {
			var rect = e.target.getBoundingClientRect();
			this.listmenu.y = rect.y
			this.listmenu.x = rect.x;
			this.stat.isshow_listmenu = true;
		},
		onclick_requestOK : function (e) {
			this.$emit("request_answer",{user:this.account,answer:true});
		},
		onclick_requestNO : function (e) {
			this.$emit("request_answer",{user:this.account,answer:false});
		}
	}
});
//===----------------------------------------------------------------------===
//  Component: reply-inputbox
//===----------------------------------------------------------------------===
Vue.component("reply-inputbox", {
	template: CONS_TEMPLATE_REPLYINPUT,
	mixins: [vue_mixin_for_inputtoot],
	props: {
		id : String,
		visibility : Boolean,
		translation: Object,
		globalinfo: Object,
		first_sharescope : String,
		popuping : {
			type : String,
			default : ""
		},
		/**
		 * @param {String} reply_to_id toot ID to reply 
		 * @param {String} mention_to_id user ID to reply
		 * @param {Object} reply_account user object to reply
		 * @param {String} selectaccount account data to use as sender
		 */
		replydata : Object
	},
	data() {
		return {
			reply_to_id : "",
			//mention_to_id : "",
			isfirst : true,
			ckeditor : {},
			btnflags : {
				send_disabled : false
			},

			//---share scope box and mention box data
            sharescopes : [
                {text : _T("sel_tlpublic"), value: "tt_public", avatar: "public", selected:{"red-text":true}},
                {text : _T("sel_tlonly"),   value: "tt_tlonly", avatar: "lock_open",selected:{"red-text":false}},
                {text : _T("sel_private"),  value: "tt_private", avatar: "lock",selected:{"red-text":false}},
                {text : _T("sel_direct"),  value: "tt_direct", avatar: "email",selected:{"red-text":false}},
            ],
			selsharescope : {
				text : _T("sel_tlpublic"),
				value : "tt_public",
				avatar : "public",
				selected:{"red-text":true}
			},

		}
	},
	beforeMount(){
	},
	mounted(){
		//---each initialize
		this.selaccounts.push(this.replydata.selectaccount);
		this.reply_to_id = this.replydata.reply_to_id;
		//this.mention_to_id = this.replydata.mention_to_id;

		//this.ckeditor.on("keydown",this.onkeydown_inputcontent);
		//this.ckeditor.on("dragstart",this.ondragover_inputcontent);
		//this.ckeditor.on("change",this.onchange_inputcontent);
		this.selmentions.push("@"+this.replydata.reply_account.acct);

		var tmpscope = "tt_"+this.first_sharescope;
		if (this.first_sharescope == "unlisted") {
			tmpscope = "tt_tlonly"	
		}
		//console.log("first_sharescope=",this.first_sharescope,tmpscope);
		var hitscopes = this.sharescopes.filter(e=>{
			if (tmpscope == e.value) {
				return true;
			}
			return false;
		});
		//console.log(hitscopes);
		this.select_scope(hitscopes[0]);

		//---setup CKeditor
		CKEDITOR.disableAutoInline = true;
		CK_INPUT_TOOTBOX.mentions[0].feed = this.autocomplete_mention_func;
		this.ckeditor = CKEDITOR.inline( this.movingElementID('replyinput_'), CK_INPUT_TOOTBOX);

		console.log("this.status_text=",this.status_text);
		//this.ckeditor.setData(this.status_text);

		$("#dv_inputcontent").pastableContenteditable();
		$("#dv_inputcontent").on('pasteImage',  (ev, data) => {
			console.log(ev,data);
			if (this.dialog || this.otherwindow) {
				this.loadMediafiles("blob",[data.dataURL]);
			}
		}).on('pasteImageError', (ev, data) => {
			alert('error paste:',data.message);
			if(data.url){
				alert('But we got its url anyway:' + data.url)
			}
		}).on('pasteText',  (ev, data) => {
			console.log("text: " + data.text);
		});

	},
	updated() {
		/*if (this.isfirst) {
			CKEDITOR.disableAutoInline = true;
			CK_INPUT_TOOTBOX.mentions[0].feed = this.autocomplete_mention_func;
			//console.log("popuping=",this.popuping + 'replyinput_'+this.id);
			//console.log(ID(this.popuping + 'replyinput_'+this.id));
			this.ckeditor = CKEDITOR.inline( this.popuping + 'replyinput_'+this.id, CK_INPUT_TOOTBOX);
	
			this.isfirst = false;
		}*/
	},
	computed : {

	},
	methods: {
		movingElementID : function (text) {
			return this.popuping + text + this.id;
		},
		select_scope: function (item) {
			for (var i = 0; i < this.sharescopes.length; i++) {
				this.sharescopes[i].selected["red-text"] = false;
			}
			item.selected["red-text"] = true;
			this.selsharescope.text = item.text;
			this.selsharescope.value = item.value;
			this.selsharescope.avatar = item.avatar;
		},
		autocomplete_mention_func : CK_dataFeed_mention,
		//---event handler-------------------------------------
		onfocus_dv_inputcontent: function (e) {
			//e.target.nextElementSibling.classList.remove("common_ui_off");
		},
		onclick_btn_reply_cancel: function (e) {
			var msg = _T("msg_cancel_post");

			appConfirm(msg,()=>{
				this.ckeditor.editable().setText("");
				this.status_text = "";
				this.selsharescope = {
					text : _T("sel_tlpublic"),
					value : "tt_public",
					avatar : "public",
					selected:{"red-text":true}
				};
				this.selmedias.splice(0,this.selmedias.length);
				this.medias.splice(0,this.medias.length);
				this.switch_NSFW = false;
				this.seltags.splice(0,this.seltags.length);
				this.tags.splice(0,this.tags.length);
				this.strlength = 0;
			});

		},
		onclick_btn_reply_post : function (e) {
			var pros = [];
			for (var i = 0; i < this.selaccounts.length; i++) {
				var account = this.getTextAccount2Object(i);
				console.log(account);
				var mediaids = [];
				for (var m = 0; m < this.medias.length; m++) {
					mediaids.push(this.medias[m][account.acct].id);
				}
				var pr = MYAPP.executePost(this.joinStatusContent(),{
					"in_reply_to_id" : this.reply_to_id,
					"account" : account,
					"scope" : this.selsharescope,
					"media" : mediaids
				});
				pros.push(pr);
			}

			Promise.all(pros)
			.then(values=>{
				//---clear input and close popup
				this.status_text = "";
				this.selmentions.splice(0,this.selmentions.length);
				this.seltags.splice(0,this.seltags.length);
				this.selmedias.splice(0,this.selmedias.length);


				if (!this.fullscreen) {
					this.dialog = false;
				}
			})
			.finally(()=>{
				//---recover base reply mention of this toot 
				this.selmentions.push("@"+this.replydata.reply_account.acct);

				//---fire onreplied event to parent element

				this.status_text = "";
				this.mainlink.exists = false;
				this.ckeditor.editable().setText("");
				this.seltags.splice(0,this.seltags.length);
				this.selmedias.splice(0,this.selmedias.length);
				this.medias.splice(0,this.medias.length);
				this.switch_NSFW = false;

				this.$emit('replied');
			});
		}

	}
});


//===----------------------------------------------------------------------===
//  Component: tootgallery-carousel
//===----------------------------------------------------------------------===
Vue.component("tootgallery-carousel", {
    template: CONS_TEMPLATE_TOOTGALLERY_CAROUSEL,
    components: {
		'carousel': VueCarousel.Carousel,
		'slide': VueCarousel.Slide
	},
	props: {
        medias : Array,
        sensitive : Boolean,
		translation : Object,
    },
    data(){
        return {
			is_pause : false
        }
    },
    mounted(){
        /*console.log("el=",this.$el);
        $(this.$el).slick({
            dots : true,
            infinite : true,
            speed : 300,
            lazyload : "progressive",
            slidesToShow : 1,
            adaptiveHeight : true
        });
        this.$el.querySelector(".slick-list.draggable").style.height="";
        */
    },
    methods : {
        onmouseenter_gifv : function (e) {
			if (this.is_pause) {
				var pro = e.target.play();
				if (pro !== undefined) {
					pro.then(()=>{
						console.log("play");
					}).catch(error=>{
						console.log(error);
					});
				}
			}else{
				e.target.pause();
			}
			this.is_pause = !this.is_pause;
		},
		onmouseleave_gifv : function (e) {
			e.target.pause();
		},
    }
});

//===----------------------------------------------------------------------===
//  Component: dmessage-item
//===----------------------------------------------------------------------===
Vue.component("dmessage-item", {
    template: CONS_TEMPLATE_DMSGBODY,
	props: {
		translation: Object,
		/**
		 * type : me, they
		 * 
		 */
		user_direction : Object,
		toote: {
			type : Object,
			default : null
		},
    },
    data(){
        return {
			elementStyle : {
				"comment-list" : {
					sizing : true
				},
				"toot_avatar_imgsize" : "32px"

			},

			//---reaction dialog: favorite, boost
			is_reactiondialog : false,
			reaction_dialog_title : "",
			reaction_info : {
				max_id : "",
				since_id : "",
			},
			reaction_accounts : [],
			
			is_pause : false
        }
    },
    mounted(){
		jQuery.timeago.settings.cutoff = (1000*60*60*24) * 3;
		$("time.timeago").timeago();
	},
	computed : {
		favourite_type : function() {
			return _T("favourite_"+MYAPP.session.config.application.showMode);
		},
		favourite_icon : function () {
			if (MYAPP.session.config.application.showMode == "gplus") {
				return "plus_one";
			}else if (MYAPP.session.config.application.showMode == "twitter") {
				return "favorite";
			}else{
				return "star";
			}
		},

	},
    methods : {
		full_display_name : function(user) {
			return MUtility.replaceEmoji(user.display_name,user.instance,user.emojis,18) + `@${user.instance}`;
		},
		onclick_ttbtn_fav: function(e) {
			var mainfunc = () => {
				//console.log("target=",e.target);
				e.target.parentElement.classList.add("pulse");
				MYAPP.sns.setFav(this.toote.id, !this.toote.body.favourited, {api:{},app:{}})
				.then(result=>{
					e.target.parentElement.classList.remove("pulse");
					//console.log("fav after=",result);
					this.toote.body.favourites_count = result.favourites_count;
					//---change color for favourited state.
					this.toote.reactions.fav["lighten-3"] = result.favourited ? false : true;
				});
			};
			//console.log("onclick_ttbtn_fav=",e,JSON.original(this.toote),!this.toote.body.favourited);
			if (MYAPP.session.config.action.confirmBefore) {
				var msg = _T("msg_confirm_fav_"+MYAPP.session.config.application.showMode);
				appConfirm(msg,mainfunc);
			}else{
				mainfunc();
			}
		},
		onclick_reaction_fav : function (toote) {
			this.reaction_dialog_title = this.favourite_reaction_msg();
			MYAPP.sns.getFavBy(toote.body.id,{
				api : {},
				app : {}
			},"")
			.then(result => {
				//console.log("result.data=",result.data);
				this.reaction_accounts.splice(0,this.reaction_accounts.length);
				for (var i = 0; i < result.data.length; i++) {
					this.reaction_accounts.push(result.data[i]);
				}
				this.is_reactiondialog = !this.is_reactiondialog;
			});
		},
		onclick_toote_delete : function (toote,commentIndex) {
			var mainfunc = () => {
				console.log("target=",toote,commentIndex);
				MYAPP.sns.deleteStatus(toote.body.id)
				.then(result=>{
					console.log("del after=",result);
					if (commentIndex > -1) {
						//---if comment, delete this in here
						this.toote.descendants.splice(commentIndex,1);
						if (this.toote.descendants.length < 1) {
							this.comment_stat.close = true;
							this.comment_stat.mini = false;
							this.comment_stat.open = false;
						}
					}else{
						//---if toot own, to connect to parent component
						this.$emit("delete_toot",toote.body.id);
					}
				});
			};
			if (MYAPP.session.config.action.confirmBefore) {
				var msg = _T("msg_delete_toot");
				appConfirm(msg,mainfunc);
			}else{
				mainfunc();
			}
		},
    }
});