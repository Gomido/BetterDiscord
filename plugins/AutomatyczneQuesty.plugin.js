/**
 * @name AutomatyczneQuesty
 * @author Lilki | XenonColt | Aamia
 * @version 0.0.1
 * @description Rozpocznij questa aby skrypt go automatycznie wykonał
 * @source https://github.com/Gomido/BetterDiscord
 * @updateUrl https://gomido.github.io/BetterDiscord/plugins/AutomatyczneQuesty.plugin.js
 */

const config = {
    main: 'AutomatyczneQuesty.plugin.js',
    info: {
        name: 'AutomatyczneQuesty',
        version: "0.0.2",
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

        let ApplicationStreamingStore = Webpack.Stores.ApplicationStreamingStore;
        // let FluxDispatcher = Webpack.getByKeys('dispatch', 'subscribe', 'register');
        let api = Webpack.getModule(m => m?.Bo?.get)?.Bo;
        let RunningGameStore = Webpack.Stores.RunningGameStore;

        if (!quest) {
            Logger.info(this._config.info.name, "Brak nieukończonych questów.");
            UI.showToast("Brak nieukończonych questów", {type:"info"});
            return;
        }

        const pid = Math.floor(Math.random() * 30000) + 1000;
        const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"]
            .find(x => quest.config.taskConfigV2.tasks[x] != null);
        const secondsNeeded = quest.config.taskConfigV2.tasks[taskName].target;
        let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;

        if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
            const maxPreview = 10, speed = 7, intervalTime = 1;
            const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime();
            let isFinished = false;

            (async () => {
                while (true) {
                    const maxAllowedTime = Math.floor((Date.now() - enrolledAt)/ 1000) + maxPreview;
                    const diff = maxAllowedTime - secondsDone;
                    const timestamp = secondsDone + speed;

                    if (diff >= speed) {
                        const response = await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}});
                        isFinished = response.body.completed_at != null;
                        secondsDone = Math.min(secondsNeeded, timestamp);
                    }

                    if (timestamp >= secondsNeeded) {
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, intervalTime * 1000));
                }
                if (!isFinished) {
                    await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: secondsNeeded}});
                }
                Logger.info(this._config.info.name, "Quest wykonany!");
                UI.showToast("Quest wykonany!", {type:"success"});
            })();

            Logger.info(this._config.info.name, `Spoof wideło: ${this._activeQuestName}.`);
            UI.showToast(`Spoof ${this._activeQuestName}. Zaczekaj ~${Math.ceil((secondsNeeded - secondsDone)/speed)} sekund.`, {type:"info"});
        }
        else if (taskName === "PLAY_ON_DESKTOP") {
            api.get({url: `/applications/public?application_ids=${this._activeQuestId}`}).then(res => {
                const appData = res.body[0];
                const exeName = appData.executables.find(x => x.os === "win32").name.replace(">","");
                const fakeGame = {
                    cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                    exeName,
                    exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
                    hidden: false,
                    isLauncher: false,
                    id: this._activeQuestId,
                    name: appData.name,
                    pid: pid,
                    pidPath: [pid],
                    processName: appData.name,
                    start: Date.now(),
                };
                const realGames = RunningGameStore.getRunningGames();
                const fakeGames = [fakeGame];
                const realGetRunningGames = RunningGameStore.getRunningGames;
                const realGetGameForPID = RunningGameStore.getGameForPID;
                //games.push(fakeGame);
                RunningGameStore.getRunningGames = () => fakeGames;
                RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid);
                //FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames});
                
                let fn = data => {
                    let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
                    Logger.info(this._config.info.name, `Postęp questa: ${progress}/${secondsNeeded}`);
                    UI.showToast(`Postęp questa: ${progress}/${secondsNeeded}`, {type:"info"});
                    if(progress >= secondsNeeded) {
                        Logger.info(this._config.info.name, "Quest wykonany!");
                        UI.showToast("Quest wykonany!", {type:"success"});
                        // const idx = games.indexOf(fakeGame);
                        // if(idx > -1) {
                        //     games.splice(idx, 1);
                        //     FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: []});
                        // }
                        RunningGameStore.getRunningGames = realGetRunningGames;
                        RunningGameStore.getGameForPID = realGetGameForPID;
                       // FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: [] });
                        // FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                    }
                };
                // FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                Logger.info(this._config.info.name, `Zmieniono grę na ${this._activeQuestName}. Zaczekaj ~${Math.ceil((secondsNeeded - secondsDone)/60)} minut.`);
                UI.showToast(`Zmieniono grę na ${this._activeQuestName}. Zaczekaj ~${Math.ceil((secondsNeeded - secondsDone)/60)} minut.`, {type:"info"});
            });
        }
        else if (taskName === "STREAM_ON_DESKTOP") {
            this._originalStreamerFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
            ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                id: this._activeQuestId,
                pid,
                sourceName: null
            });
            let fn = data => {
                let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
                Logger.info(this._config.info.name, `Postęp questa: ${progress}/${secondsNeeded}`);
                UI.showToast(`Postęp questa: ${progress}/${secondsNeeded}`, {type:"info"});
                if(progress >= secondsNeeded) {
                    Logger.info(this._config.info.name, "Quest wykonany!");
                    UI.showToast("Quest wykonany!", {type:"success"});
                    ApplicationStreamingStore.getStreamerActiveStreamMetadata = this._originalStreamerFunc;
                    //FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                }
            };
            // FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
            Logger.info(this._config.info.name, `Zmieniono stream na ${this._activeQuestName}. Streamuj ~${Math.ceil((secondsNeeded - secondsDone)/60)} minut. (Wymagana jedna osoba na kanale głosowym (wejdź drugim kontem))`);
            UI.showToast(`Zmieniono stream na ${this._activeQuestName}. Streamuj ~${Math.ceil((secondsNeeded - secondsDone)/60)} minut. (Wymagana jedna osoba na kanale głosowym (wejdź drugim kontem))`, {type:"info"});
        }
        else if (taskName === "PLAY_ACTIVITY") {
            const channelId = Webpack.Stores.ChannelStore.getSortedPrivateChannels()[0]?.id ||
                Object.values(Webpack.Stores.GuildChannelStore.getAllGuilds()).find(x => x && x.VOCAL.length > 0).VOCAL[0].channel.id;
            const streamKey = `call:${channelId}:1`;
            (async () => {
                Logger.info(this._config.info.name, "Quest wykonany", this._activeQuestName, "-", quest.config.messages.questName);
                UI.showToast(`Quest wykonany ${this._activeQuestName} - ${quest.config.messages.questName}`, {type:"info"});
                while(true) {
                    const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}});
                    const progress = res.body.progress.PLAY_ACTIVITY.value;
                    Logger.info(this._config.info.name, `Postęp questa: ${progress}/${secondsNeeded}`);
                    UI.showToast(`Postęp questa: ${progress}/${secondsNeeded}`, {type:"info"});
                    await new Promise(resolve => setTimeout(resolve, 20000));
                    if(progress >= secondsNeeded) {
                        await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}});
                        break;
                    }
                }
                Logger.info(this._config.info.name, "Quest wykonany!");
                UI.showToast("Quest wykonany!", {type:"success"});
            })();
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
