/**
 * @name AutomatyczneQuesty
 * @author Lilki | XenonColt | Aamia
 * @version 0.0.3
 * @description Rozpocznij questa aby skrypt go automatycznie wykonał
 * @source https://github.com/Gomido/BetterDiscord
 * @updateUrl https://gomido.github.io/BetterDiscord/plugins/AutomatyczneQuesty.plugin.js
 */

const config = {
    main: 'AutomatyczneQuesty.plugin.js',
    info: {
        name: 'AutomatyczneQuesty',
        version: "0.0.3",
        description: "Skrypt do automatycznego wykonywania Questów",
    },
    changelog: [
         {
             title: "Zmiany",
             type: "changed",
             items: [
                 "Poprawiona opcja wyłączania powiadomienia o nowym queście",
                 "Zmiana wersji skryptu"
             ]
         }
        //  {
        //      title: "Zmiany",
        //      type: "changed",
        //      items: [
        //          "Zmiana 1",
        //          "Zmiana 2"
        //      ]
        // }
    ],
    settingsPanel: [
        {
            type: "switch",
            id: "enableNotify",
            name: "Powiadomienie o nowym queście",
            note: "Włącz/Wyłącz info, że jest dostępny nowy quest",
            value: true
        }
    ]
}

const { Webpack, UI, Logger, Data, Utils } = BdApi;

class AutomatyczneQuesty {
    constructor() {
        this._config = config;
        this._questsStore = Webpack.Stores.QuestStore;
        this._boundHandleQuestChange = this.handleQuestChange.bind(this);
        this._boundNewQuestHandler = this.handleNewQuest.bind(this);
        this._activeQuestId = null;
        this._activeQuestName = null;
        this.settings;

        try {
            let currentVersionInfo = {};
            try {
                currentVersionInfo = Object.assign({}, { version: this._config.info.version, hasShownChangelog: false }, Data.load(this._config.info.name, "currentVersionInfo"));
            } catch (err) {
                currentVersionInfo = { version: this._config.info.version, hasShownChangelog: false };
            }
            if (this._config.info.version != currentVersionInfo.version) currentVersionInfo.hasShownChangelog = false;
            currentVersionInfo.version = this._config.info.version;
            Data.save(this._config.info.name, "currentVersionInfo", currentVersionInfo);

            this.checkForUpdate();

            if (!currentVersionInfo.hasShownChangelog) {
                UI.showChangelogModal({
                    title: "AutomatyczneQuesty Lista Zmian",
                    subtitle: this._config.info.version,
                    changes: this._config.changelog
                });
                currentVersionInfo.hasShownChangelog = true;
                Data.save(this._config.info.name, "currentVersionInfo", currentVersionInfo);
            }
        }
        catch (err) {
            Logger.error(this._config.info.name, err);
        }
    }

    start() {
        this.settings = Data.load(this._config.info.name, "settings") || this._config.settingsPanel.reduce((acc, setting) => {
            acc[setting.id] = setting.value;
            return acc;
        }, {});
        try {
            if (this._questsStore && this._questsStore.addChangeListener) {
                this._questsStore.addChangeListener(this._boundHandleQuestChange);
                this._questsStore.addChangeListener(this._boundNewQuestHandler);
            }
            const quest = [...this._questsStore.quests.values()].find(x =>
                x.id !== "1248385850622869556" &&
                x.userStatus?.enrolledAt &&
                !x.userStatus?.completedAt &&
                new Date(x.config.expiresAt).getTime() > Date.now()
            );

            if (this._questsStore && quest) {
                this._activeQuestId = quest.config.application.id;
                this._activeQuestName = quest.config.application.name;
                this.runQuest(quest);
            }
        } catch (e) {
            Logger.error(this._config.info.name, "Błąd", e);
            UI.showToast("Błąd podczas uruchamiania skryptu", {type:"error"});
        }
    }

    stop() {
        if (this._questsStore && this._questsStore.removeChangeListener) {
            this._questsStore.removeChangeListener(this._boundHandleQuestChange);
        }

    }

    getSettingsPanel() {
        for (const settings of this._config.settingsPanel) {
            settings.value = this.settings[settings.id];
        }

        return UI.buildSettingsPanel({
            settings: this._config.settingsPanel,
            onChange: (category, id, value) => {
                this.settings[id] = value;
                Data.save(this._config.info.name, "settings", this.settings);
            }
        });
    }

    handleNewQuest() {
        const quest = [...this._questsStore.quests.values()].find(x =>
            x.id !== "1248385850622869556" &&
            x.userStatus?.enrolledAt &&
            !x.userStatus?.completedAt &&
            new Date(x.config.expiresAt).getTime() > Date.now()
        );

        const new_quest = [...this._questsStore.quests.values()].find(x =>
            x.id !== "1248385850622869556" &&
            !x.userStatus?.enrolledAt &&
            !x.userStatus?.completedAt &&
            new Date(x.config.expiresAt).getTime() > Date.now()
        );

        if (new_quest && new_quest !== quest && this.settings.enableNotify) {
            // UI.showNotice("New quest available! Please accept it to start auto completing.", {
            //     type: "info",
            //     timeout: 5 * 60 * 1000,
            //     buttons: [
            //         {
            //             label: "Go to Quests",
            //             onClick: () => {
            //                 open(`/quests/${new_quest.id}`);
            //             }
            //         }
            //     ]
            // });
            this.showQuestNotification(new_quest);
        }
    }

    showQuestNotification(quest, reminder = false) {
        const title = reminder ? `Nowy quest!` : `Nowy quest!`;
        UI.showNotification({
            title: title,
            content: `Pojawił się nowy quest "${quest.config.application.name}" Przejdź do zakładki Questy!`,
            type: "info",
            duration: 1 * 60 * 1000,
            // actions: [
            //     {
            //         label: "Przejdź do questów",
            //         onClick: () => {
            //             open(`/quests/${quest.id}`);
            //         }
            //     },
            //     {
            //         label: "Przypominij później",
            //         onClick: () => {
            //             setTimeout(() => {
            //                 this.showQuestNotification(quest, true);
            //             }, 60 * 60 * 1000);
            //         }
            //     }
            // ]
        })
    }

    handleQuestChange() {
        const quest = [...this._questsStore.quests.values()].find(x =>
            x.id !== "1248385850622869556" &&
            x.userStatus?.enrolledAt &&
            !x.userStatus?.completedAt &&
            new Date(x.config.expiresAt).getTime() > Date.now()
        );

        if (quest && quest.config.application.id !== this._activeQuestId) {
            this._activeQuestId = quest.config.application.id;
            this._activeQuestName = quest.config.application.name;
            UI.showToast(`Znaleziono nowy quest: ${this._activeQuestName}`, {type:"info"});
            this.runQuest(quest);
        }
    }


    // Skrypt questów od Amiaa 
    runQuest(quest) {
       delete window.$;
let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();


let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.Z;
let RunningGameStore, QuestsStore, ChannelStore, GuildChannelStore, FluxDispatcher, api
if(!ApplicationStreamingStore) {
	ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata).exports.A;
	RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getRunningGames).exports.Ay;
	QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getQuest).exports.A;
	ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getAllThreadsForParent).exports.A;
	GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getSFWDefaultChannel).exports.Ay;
	FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.h?.__proto__?.flushWaitQueue).exports.h;
	api = Object.values(wpRequire.c).find(x => x?.exports?.Bo?.get).exports.Bo;
} else {
	RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames).exports.ZP;
	QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest).exports.Z;
	ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent).exports.Z;
	GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel).exports.ZP;
	FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue).exports.Z;
	api = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get).exports.tn;	
}

const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"]
let quests = [...QuestsStore.quests.values()].filter(x => x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now() && supportedTasks.find(y => Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y)))
let isApp = typeof DiscordNative !== "undefined"
if(quests.length === 0) {
	console.log("You don't have any uncompleted quests!")
} else {
	let doJob = function() {
		const quest = quests.pop()
		if(!quest) return

		const pid = Math.floor(Math.random() * 30000) + 1000
		
		const applicationId = quest.config.application.id
		const applicationName = quest.config.application.name
		const questName = quest.config.messages.questName
		const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2
		const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null)
		const secondsNeeded = taskConfig.tasks[taskName].target
		let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0

		if(taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
			const maxFuture = 10, speed = 7, interval = 1
			const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime()
			let completed = false
			let fn = async () => {			
				while(true) {
					const maxAllowed = Math.floor((Date.now() - enrolledAt)/1000) + maxFuture
					const diff = maxAllowed - secondsDone
					const timestamp = secondsDone + speed
					if(diff >= speed) {
						const res = await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}})
						completed = res.body.completed_at != null
						secondsDone = Math.min(secondsNeeded, timestamp)
					}
					
					if(timestamp >= secondsNeeded) {
						break
					}
					await new Promise(resolve => setTimeout(resolve, interval * 1000))
				}
				if(!completed) {
					await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: secondsNeeded}})
				}
				console.log("Quest completed!")
				doJob()
			}
			fn()
			console.log(`Spoofing video for ${questName}.`)
		} else if(taskName === "PLAY_ON_DESKTOP") {
			if(!isApp) {
				console.log("This no longer works in browser for non-video quests. Use the discord desktop app to complete the", questName, "quest!")
			} else {
				api.get({url: `/applications/public?application_ids=${applicationId}`}).then(res => {
					const appData = res.body[0]
					const exeName = appData.executables.find(x => x.os === "win32").name.replace(">","")
					
					const fakeGame = {
						cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
						exeName,
						exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
						hidden: false,
						isLauncher: false,
						id: applicationId,
						name: appData.name,
						pid: pid,
						pidPath: [pid],
						processName: appData.name,
						start: Date.now(),
					}
					const realGames = RunningGameStore.getRunningGames()
					const fakeGames = [fakeGame]
					const realGetRunningGames = RunningGameStore.getRunningGames
					const realGetGameForPID = RunningGameStore.getGameForPID
					RunningGameStore.getRunningGames = () => fakeGames
					RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid)
					FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames})
					
					let fn = data => {
						let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value)
						console.log(`Quest progress: ${progress}/${secondsNeeded}`)
						
						if(progress >= secondsNeeded) {
							console.log("Quest completed!")
							
							RunningGameStore.getRunningGames = realGetRunningGames
							RunningGameStore.getGameForPID = realGetGameForPID
							FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: []})
							FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
							
							doJob()
						}
					}
					FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
					
					console.log(`Spoofed your game to ${applicationName}. Wait for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`)
				})
			}
		} else if(taskName === "STREAM_ON_DESKTOP") {
			if(!isApp) {
				console.log("This no longer works in browser for non-video quests. Use the discord desktop app to complete the", questName, "quest!")
			} else {
				let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata
				ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
					id: applicationId,
					pid,
					sourceName: null
				})
				
				let fn = data => {
					let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value)
					console.log(`Quest progress: ${progress}/${secondsNeeded}`)
					
					if(progress >= secondsNeeded) {
						console.log("Quest completed!")
						
						ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc
						FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
						
						doJob()
					}
				}
				FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)
				
				console.log(`Spoofed your stream to ${applicationName}. Stream any window in vc for ${Math.ceil((secondsNeeded - secondsDone) / 60)} more minutes.`)
				console.log("Remember that you need at least 1 other person to be in the vc!")
			}
		} else if(taskName === "PLAY_ACTIVITY") {
			const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id
			const streamKey = `call:${channelId}:1`
			
			let fn = async () => {
				console.log("Completing quest", questName, "-", quest.config.messages.questName)
				
				while(true) {
					const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}})
					const progress = res.body.progress.PLAY_ACTIVITY.value
					console.log(`Quest progress: ${progress}/${secondsNeeded}`)
					
					await new Promise(resolve => setTimeout(resolve, 20 * 1000))
					
					if(progress >= secondsNeeded) {
						await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}})
						break
					}
				}
				
				console.log("Quest completed!")
				doJob()
			}
			fn()
		}
	}
	doJob()
}
    }

  
    parseMeta(fileContent) {
        const meta = {};
        const regex = /@([a-zA-Z]+)\s+(.+)/g;
        let match;
        while ((match = regex.exec(fileContent)) !== null) {
            meta[match[1]] = match[2].trim();
        }
        return meta;
    }
}

module.exports = AutomatyczneQuesty;
