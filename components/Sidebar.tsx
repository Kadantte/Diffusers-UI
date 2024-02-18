import React, {useContext, useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/icons/favicon.png"
import {EnableDragContext, MobileContext, SiteHueContext, SiteSaturationContext, SiteLightnessContext, ImagesContext, UpdateSavedContext,
PromptContext, LorasContext, TextualInversionsContext, HypernetworksContext, ReverseSortContext, NSFWImagesContext, SidebarTypeContext,
ImageInputImagesContext, TabContext, NegativePromptContext, NSFWTabContext} from "../Context"
import functions from "../structures/Functions"
import historyIcon from "../assets/icons/history.png"
import nsfwIcon from "../assets/icons/nsfw.png"
import imageIcon from "../assets/icons/image.png"
import saved from "../assets/icons/saved.png"
import networks from "../assets/icons/networks.png"
import networkPlaceholder from "../assets/images/network-placeholder.png"
import folderPlaceholder from "../assets/images/folder-placeholder.png"
import arrowBack from "../assets/icons/arrow-back.png"
import sortDown from "../assets/icons/sort-down.png"
import sortUp from "../assets/icons/sort-up.png"
import Image from "./Image"
import "./styles/sidebar.less"
import axios from "axios"

let pos = 0
let scrollLock = false

const SideBar: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const [activeDropdown, setActiveDropdown] = useState(false)
    const {images, setImages} = useContext(ImagesContext)
    const {nsfwImages, setNSFWImages} = useContext(NSFWImagesContext)
    const {imageInputImages, setImageInputImages} = useContext(ImageInputImagesContext)
    const {updateSaved, setUpdateSaved} = useContext(UpdateSavedContext)
    const {textualInversions, setTextualInversions} = useContext(TextualInversionsContext)
    const {hypernetworks, setHypernetworks} = useContext(HypernetworksContext)
    const {loras, setLoras} = useContext(LorasContext)
    const [loraFolder, setLoraFolder] = useState(".")
    const [textualInversionFolder, setTextualInversionFolder] = useState(".")
    const [hypernetworkFolder, setHypernetworkFolder] = useState(".")
    const [networkType, setNetworkType] = useState("textual inversion")
    const {prompt, setPrompt} = useContext(PromptContext)
    const {negativePrompt, setNegativePrompt} = useContext(NegativePromptContext)
    const {sidebarType, setSidebarType} = useContext(SidebarTypeContext)
    const {reverseSort, setReverseSort} = useContext(ReverseSortContext)
    const {nsfwTab, setNsfwTab} = useContext(NSFWTabContext)
    const {tab, setTab} = useContext(TabContext)
    const [lastSidebarType, setLastSidebarType] = useState("history")
    const [slice, setSlice] = useState([])
    const [sliceIndex, setSliceIndex] = useState(0)
    const scrollRef = useRef<HTMLDivElement>(null)
    const history = useHistory()

    useEffect(() => {
        const savedSidebarType = localStorage.getItem("sidebarType")
        if (savedSidebarType) setSidebarType(savedSidebarType)
        const savedNetworkType = localStorage.getItem("sidebarNetworkType")
        if (savedNetworkType) setNetworkType(savedNetworkType)
        const savedLoraFolder = localStorage.getItem("loraFolder")
        if (savedLoraFolder) setLoraFolder(savedLoraFolder)
        const savedTextualInversionFolder = localStorage.getItem("textualInversionFolder")
        if (savedTextualInversionFolder) setTextualInversionFolder(savedTextualInversionFolder)
        const savedHypernetwork = localStorage.getItem("hypernetworkFolder")
        if (savedHypernetwork) setHypernetworkFolder(savedHypernetwork)
    }, [])

    useEffect(() => {
        localStorage.setItem("sidebarType", String(sidebarType))
        localStorage.setItem("sidebarNetworkType", String(networkType))
        localStorage.setItem("loraFolder", String(loraFolder))
        localStorage.setItem("textualInversionFolder", String(textualInversionFolder))
        localStorage.setItem("hypernetworkFolder", String(hypernetworkFolder))
    }, [sidebarType, networkType, loraFolder])

    useEffect(() => {
        if (updateSaved) {
            forceUpdate()
            setUpdateSaved(false)
        }
    }, [updateSaved])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 50}%)`
    }

    useEffect(() => {
        const max = 100 + (sliceIndex * 100)
        if (sidebarType === "history") {
            setLastSidebarType("history")
            const slice = reverseSort ? images.slice(Math.max(images.length - max - 1, 0), images.length - 1) : images.slice(0, max)
            setSlice(slice)
        }
        if (sidebarType === "nsfw") {
            setLastSidebarType("nsfw")
            const slice = reverseSort ? nsfwImages.slice(Math.max(nsfwImages.length - max - 1, 0), nsfwImages.length - 1) : nsfwImages.slice(0, max)
            setSlice(slice)
        }
        if (sidebarType === "image") {
            setLastSidebarType("image")
            const slice = reverseSort ? imageInputImages.slice(Math.max(imageInputImages.length - max - 1, 0), imageInputImages.length - 1) : imageInputImages.slice(0, max)
            setSlice(slice)
        }
        if (sidebarType === "saved") {
            setLastSidebarType("saved")
            let saved = localStorage.getItem("saved") || "[]" as any
            saved = JSON.parse(saved)
            const slice = reverseSort ? saved.slice(Math.max(saved.length - max - 1, 0), saved.length - 1) : saved.slice(0, max)
            setSlice(slice)
        }
    }, [sidebarType, images, nsfwImages, imageInputImages, reverseSort, sliceIndex])

    useEffect(() => {
        if (sidebarType !== lastSidebarType) {
            setSliceIndex(0)
            if (scrollRef.current) scrollRef.current.scrollTop = 0
        }
    }, [sidebarType, lastSidebarType])

    const handleScroll = (event: React.UIEvent) => {
        if(!slice.length) return
        if (scrollLock) return
        if (sidebarType === "networks") return
        if (Math.abs(event.currentTarget.scrollHeight - (event.currentTarget.scrollTop + event.currentTarget.clientHeight)) <= 1) {
            scrollLock = true
            setSliceIndex((prev: number) => prev + 1)
            setTimeout(() => {
                scrollLock = false
            }, 1000)
        }
    }

    const historyJSX = () => {
        let jsx = [] as any
        if (reverseSort) {
            for (let i = slice.length - 1; i >= 0; i--) {
                jsx.push(<Image img={slice[i]} small={true}/>)
            }
        } else {
            for (let i = 0; i < slice.length; i++) {
                jsx.push(<Image img={slice[i]} small={true}/>)
            }
        }
        return jsx
    }

    const appendToPrompt = (str: string) => {
        if (tab === "settings") {
            const newStr = `${str}, ${negativePrompt}`
            setNegativePrompt(newStr)
        } else {
            const newStr = `${str}, ${prompt}`
            setPrompt(newStr)
        }
    }

    const modelFolderJSX = (modelType: string, modelFolder: any) => {
        let jsx = [] as any
        for (let i = reverseSort ? modelFolder.length - 1 : 0; reverseSort ? i >= 0: i < modelFolder.length; reverseSort ? i-- : i++) {
            const file = modelFolder[i]
            if (file.directory === true) {
                const goForward = () => {
                    if (modelType === "textual inversion") setTextualInversionFolder((prev: string) => `${prev}/${file.name}`)
                    if (modelType === "hypernetwork") setHypernetworkFolder((prev: string) => `${prev}/${file.name}`)
                    if (modelType === "lora") setLoraFolder((prev: string) => `${prev}/${file.name}`)
                }
                jsx.push(
                <div className="network-container" onClick={() => goForward()}>
                    <span className="network-dir-title">{file.name}</span>
                    <img className="network-image" src={folderPlaceholder} style={{filter: getFilter()}}/>
                </div>)
            } else {
                let isPlaceholder = false 
                let image = file.image
                if (!image) {
                    isPlaceholder = true
                    image = networkPlaceholder
                }
                const append = () => {
                    if (modelType === "textual inversion") appendToPrompt(file.name)
                    if (modelType === "hypernetwork") appendToPrompt(`<hypernet:${file.name}:1>`)
                    if (modelType === "lora") appendToPrompt(`<lora:${file.name}:1>`)
                }
                jsx.push(
                <div className="network-container" onClick={append}>
                    {isPlaceholder ? <span className="network-title">{file.name}</span> : null}
                    <img className="network-image" src={image} style={{filter: isPlaceholder ? getFilter() : ""}}/>
                </div>)
            }
        }
        return jsx
    }

    const modelJSX = (modelType: string) => {
        let modelFolder = textualInversionFolder
        if (modelType === "hypernetwork") modelFolder = hypernetworkFolder
        if (modelType === "lora") modelFolder = loraFolder
        if (modelFolder === ".") {
            let files = textualInversions
            if (modelType === "hypernetwork") files = hypernetworks
            if (modelType === "lora") files = loras
            return modelFolderJSX(modelType, files)
        } else {
            const folderList = modelFolder.split("/")
            folderList.shift()
            let searchDir = textualInversions
            if (modelType === "hypernetwork") searchDir = hypernetworks
            if (modelType === "lora") searchDir = loras
            for (let i = 0; i < folderList.length; i++) {
                for (let j = 0; j < searchDir.length; j++) {
                    if (folderList[i] === searchDir[j].name) {
                        searchDir = searchDir[j].files 
                        break
                    }
                }
            }
            const goBack = (modelFolder: string) => {
                const folderList = modelFolder.split("/")
                folderList.pop()
                if (!folderList.length) {
                    if (modelType === "textual inversion") return setTextualInversionFolder(".")
                    if (modelType === "hypernetwork") return setHypernetworkFolder(".")
                    if (modelType === "lora") return setLoraFolder(".")
                }
                if (modelType === "textual inversion") setTextualInversionFolder(folderList.join("/"))
                if (modelType === "hypernetwork") setHypernetworkFolder(folderList.join("/"))
                if (modelType === "lora") setLoraFolder(folderList.join("/"))
            }
            return (
                <div className="network-directory-container">
                    <img src={arrowBack} className="network-navigation-arrow" onClick={() => goBack(modelFolder)} style={{filter: getFilter()}}/>
                    <div className="network-files-container">
                        {modelFolderJSX(modelType, searchDir)}
                    </div>
                </div>
            )
        }
    }

    const networkJSX = () => {
        let containerJSX = null as any
        if (networkType === "textual inversion") containerJSX = modelJSX("textual inversion")
        if (networkType === "hypernetwork") containerJSX = modelJSX("hypernetwork")
        if (networkType === "lora") containerJSX = modelJSX("lora")
        return (
            <div className="sidebar-network-container">
                <div className="sidebar-network-selector">
                    <button className={`sidebar-network-button 
                    ${networkType === "textual inversion" ? 
                    "sidebar-network-button-selected" : ""}`}
                    onClick={() => setNetworkType("textual inversion")}>Textual Inversion</button>
                    <button className={`sidebar-network-button 
                    ${networkType === "hypernetwork" ? 
                    "sidebar-network-button-selected" : ""}`}
                    onClick={() => setNetworkType("hypernetwork")}>Hypernetwork</button>
                    <button className={`sidebar-network-button 
                    ${networkType === "lora" ? 
                    "sidebar-network-button-selected" : ""}`}
                    onClick={() => setNetworkType("lora")}>LoRA</button>
                </div>
                <div className="sidebar-networks">
                    {containerJSX}
                </div>
            </div>
        )
    }

    const sidebarJSX = () => {
        if (sidebarType === "networks") return networkJSX()
        return historyJSX()
    }

    if (mobile) return null

    return (
        <div className="sidebar" onMouseEnter={() => setEnableDrag(false)}>
            <div className="sidebar-title-container">
                <div className="sidebar-title-container-left">
                    <img className="sidebar-icon" src={historyIcon} style={{filter: getFilter()}} onClick={() => setSidebarType("history")}/>
                    {nsfwTab ? <img className="sidebar-icon" src={nsfwIcon} style={{filter: getFilter()}} onClick={() => setSidebarType("nsfw")}/> : null}
                    <img className="sidebar-icon" src={imageIcon} style={{filter: getFilter()}} onClick={() => setSidebarType("image")}/>
                    <img className="sidebar-icon" src={saved} style={{filter: getFilter()}} onClick={() => setSidebarType("saved")}/>
                    <img className="sidebar-icon" src={networks} style={{filter: getFilter()}} onClick={() => setSidebarType("networks")}/>
                    <span className="sidebar-header">{functions.toProperCase(sidebarType)}</span>
                </div>
                <img className="sidebar-icon" src={reverseSort ? sortUp : sortDown} style={{filter: getFilter()}} onClick={() => setReverseSort((prev: boolean) => !prev)}/>
            </div>
            <div className="sidebar-images-container" ref={scrollRef} onScroll={handleScroll}>
                {sidebarJSX()}
            </div>
        </div>
    )
}

export default SideBar