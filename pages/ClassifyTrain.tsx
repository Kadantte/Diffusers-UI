import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {EnableDragContext, MobileContext, SiteHueContext, SiteSaturationContext, SiteLightnessContext, 
ClassifyFolderLocationContext, InterrogatorNameContext, SocketContext, TrainStartedContext, TrainProgressContext,
TrainProgressTextContext, TrainCompletedContext, ClassifyFoldersContext, EpochsContext, ResolutionContext,
SaveStepsContext, LearningRateTEContext, GradientAccumulationStepsContext, LearningFunctionContext} from "../Context"
import {ProgressBar, Dropdown, DropdownButton} from "react-bootstrap"
import functions from "../structures/Functions"
import folder from "../assets/icons/folder.png"
import TrainImage from "../components/TrainImage"
import folderPlaceholder from "../assets/images/folder-placeholder.png"
import "./styles/traintag.less"
import axios from "axios"
import path from "path"

const ClassifyTrain: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {socket, setSocket} = useContext(SocketContext)
    const {classifyFolderLocation, setClassifyFolderLocation} = useContext(ClassifyFolderLocationContext)
    const {interrogatorName, setInterrogatorName} = useContext(InterrogatorNameContext)
    const {classifyFolders, setClassifyFolders} = useContext(ClassifyFoldersContext)
    const {trainProgress, setTrainProgress} = useContext(TrainProgressContext)
    const {trainProgressText, setTrainProgressText} = useContext(TrainProgressTextContext)
    const {trainStarted, setTrainStarted} = useContext(TrainStartedContext)
    const {trainCompleted, setTrainCompleted} = useContext(TrainCompletedContext)
    const {epochs, setEpochs} = useContext(EpochsContext)
    const {saveSteps, setSaveSteps} = useContext(SaveStepsContext)
    const {learningRateTE, setLearningRateTE} = useContext(LearningRateTEContext)
    const {resolution, setResolution} = useContext(ResolutionContext)
    const {gradientAccumulationSteps, setGradientAccumulationSteps} = useContext(GradientAccumulationStepsContext)
    const {learningFunction, setLearningFunction} = useContext(LearningFunctionContext)
    const progressBarRef = useRef(null) as React.RefObject<HTMLDivElement>
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 50}%)`
    }

    useEffect(() => {
        if (!socket) return
        const startTrain = () => {
            setTrainStarted(true)
            setTrainCompleted(false)
            setTrainProgress(-1)
            setTrainProgressText("")
        }
        const trackProgress = (data: any) => {
            const progress = (100 / Number(data.total_step)) * Number(data.step)
            setTrainStarted(true)
            setTrainCompleted(false)
            setTrainProgress(progress)
            setTrainProgressText(`${data.step} / ${data.total_step}`)
        }
        const completeTrain = async (data: any) => {
            setTrainCompleted(true)
            setTrainStarted(false)
        }
        const interruptTrain = () => {
            setTrainStarted(false)
        }
        socket.on("train starting", startTrain)
        socket.on("train progress", trackProgress)
        socket.on("train complete", completeTrain)
        socket.on("train interrupt", interruptTrain)
        return () => {
            socket.off("train starting", startTrain)
            socket.off("train progress", trackProgress)
            socket.off("train complete", completeTrain)
            socket.off("train interrupt", interruptTrain)
        }
    }, [socket])

    const updateLocation = async () => {
        const location = await axios.post("/update-location").then((r) => r.data)
        if (location) setClassifyFolderLocation(location)
    }

    useEffect(() => {
        const updateClassifyFolders = async () => {
            let folders = await axios.post("/list-folders", {folder: classifyFolderLocation}).then((r) => r.data)
            console.log(folders)
            setClassifyFolders(folders)
        }
        updateClassifyFolders()
    }, [classifyFolderLocation])

    const foldersJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < classifyFolders.length; i++) {
            const openLocation = async () => {
                await axios.post("/open-folder", {absolute: path.join(classifyFolderLocation, classifyFolders[i])})
            }
            jsx.push(<div className="network-container" onClick={() => openLocation()}>
                <span className="network-dir-title">{classifyFolders[i]}</span>
                <img className="network-image" src={folderPlaceholder} style={{filter: getFilter()}}/>
            </div>)
        }
        return jsx
    }

    const getText = () => {
        if (trainCompleted) return "Completed"
        if (trainProgress >= 0) return trainProgressText
        return "Starting"
    }

    const getProgress = () => {
        if (trainCompleted) return 100
        if (trainProgress >= 0) return trainProgress
        return 0
    }

    const openImageLocation = async () => {
        await axios.post("/open-folder", {absolute: classifyFolderLocation})
    }

    const train = async () => {
        const json = {} as any
        json.train_dir = classifyFolderLocation
        json.num_train_epochs = Number(epochs)
        json.learning_rate = Number(learningRateTE)
        json.gradient_accumulation_steps = Number(gradientAccumulationSteps)
        json.save_steps = Number(saveSteps)
        json.resolution = Number(resolution)
        json.learning_function = learningFunction
        await axios.post("/train-classifier", json)
    }

    const interruptTrain = async () => {
        axios.post("/interrupt-classify")
    }

    const openFolder = async () => {
        await axios.post("/open-folder", {path: `outputs/classifier/${path.basename(classifyFolderLocation, path.extname(classifyFolderLocation))}`})
    }

    const reset = () => {
        setEpochs("5")
        setSaveSteps("500")
        setLearningRateTE("5e-5")
        setGradientAccumulationSteps("1")
        setLearningFunction("linear")
        setResolution("512")
    }

    return (
        <div className="train-tag" onMouseEnter={() => setEnableDrag(false)}>
            <div className="train-tag-folder-container">
                <img className="train-tag-folder" src={folder} style={{filter: getFilter()}} onClick={updateLocation}/>
                <div className="train-tag-location" onDoubleClick={openImageLocation}>{classifyFolderLocation ? classifyFolderLocation : "None"}</div>
                <button className="train-tag-button" onClick={() => trainStarted ? interruptTrain() : train()} style={{backgroundColor: trainStarted ? "var(--buttonBGStop)" : "var(--buttonBG)"}}>{trainStarted ? "Stop" : "Train"}</button>
                <button className="train-tag-button" onClick={() => openFolder()}>Open</button>
                <button className="train-tag-button" onClick={() => reset()}>Reset</button>
            </div>
            <div className="train-tag-settings-container">
                <div className="train-tag-settings-column">
                    <div className="train-tag-settings-box">
                        <span className="train-tag-settings-title">Epochs:</span>
                        <input className="train-tag-settings-input" type="text" spellCheck={false} value={epochs} onChange={(event) => setEpochs(event.target.value)}/>
                    </div>
                    <div className="train-tag-settings-box">
                        <span className="train-tag-settings-title">Learning Rate:</span>
                        <input className="train-tag-settings-input" type="text" spellCheck={false} value={learningRateTE} onChange={(event) => setLearningRateTE(event.target.value)}/>
                    </div>
                    <div className="train-tag-settings-box">
                        <span className="train-tag-settings-title">Gradient Accumulation Steps:</span>
                        <input className="train-tag-settings-input" type="text" spellCheck={false} value={gradientAccumulationSteps} onChange={(event) => setGradientAccumulationSteps(event.target.value)}/>
                    </div>
                </div>
                <div className="train-tag-settings-column">
                    <div className="train-tag-settings-box">
                        <span className="train-tag-settings-title">Resolution:</span>
                        <input className="train-tag-settings-input" type="text" spellCheck={false} value={resolution} onChange={(event) => setResolution(event.target.value)}/>
                    </div>
                    <div className="train-tag-settings-box">
                        <span className="train-tag-settings-title">Save Steps:</span>
                        <input className="train-tag-settings-input" type="text" spellCheck={false} value={saveSteps} onChange={(event) => setSaveSteps(event.target.value)}/>
                    </div>
                    <div className="train-tag-settings-box">
                        <span className="train-tag-settings-title">Learning Function:</span>
                        <DropdownButton title={learningFunction} drop="down" className="checkpoint-selector">
                            <Dropdown.Item active={learningFunction === "constant"} onClick={() => setLearningFunction("constant")}>constant</Dropdown.Item>
                            <Dropdown.Item active={learningFunction === "linear"} onClick={() => setLearningFunction("linear")}>linear</Dropdown.Item>
                            <Dropdown.Item active={learningFunction === "cosine"} onClick={() => setLearningFunction("cosine")}>cosine</Dropdown.Item>
                            <Dropdown.Item active={learningFunction === "quadratic"} onClick={() => setLearningFunction("quadratic")}>quadratic</Dropdown.Item>
                            <Dropdown.Item active={learningFunction === "cubic"} onClick={() => setLearningFunction("cubic")}>cubic</Dropdown.Item>
                            <Dropdown.Item active={learningFunction === "quartic"} onClick={() => setLearningFunction("quartic")}>quartic</Dropdown.Item>
                        </DropdownButton>
                    </div>
                </div>
            </div>
            {trainStarted ? <div className="train-tag-progress">
                <div className="render-progress-container" style={{filter: getFilter()}}>
                    <span className="render-progress-text">{getText()}</span>
                    <ProgressBar ref={progressBarRef} animated now={getProgress()}/>
                </div>
            </div> : null}
            <div className="train-tag-images-container">
                {foldersJSX()}
            </div>
        </div>
    )
}

export default ClassifyTrain