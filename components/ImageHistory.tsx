import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/icons/favicon.png"
import {EnableDragContext, MobileContext, SiteHueContext, SiteSaturationContext, SiteLightnessContext, ImagesContext,
ReverseSortContext, SidebarTypeContext, NSFWImagesContext, ImageInputImagesContext, TabContext, ViewImagesContext} from "../Context"
import functions from "../structures/Functions"
import Image from "./Image"
import "./styles/imagehistory.less"

let scrollLock = false

const ImageHistory: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {sidebarType, setSidebarType} = useContext(SidebarTypeContext)
    const {images, setImages} = useContext(ImagesContext)
    const {nsfwImages, setNSFWImages} = useContext(NSFWImagesContext)
    const {imageInputImages, setImageInputImages} = useContext(ImageInputImagesContext)
    const {viewImages, setViewImages} = useContext(ViewImagesContext)
    const {reverseSort, setReverseSort} = useContext(ReverseSortContext)
    const {tab, setTab} = useContext(TabContext)
    const [slice, setSlice] = useState([])
    const [sliceIndex, setSliceIndex] = useState(0)
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 50}%)`
    }

    useEffect(() => {
        const max = 100 + (sliceIndex * 100)
        if (sidebarType === "history") {
            const slice = reverseSort ? images.slice(Math.max(images.length - max - 1, 0), images.length - 1) : images.slice(0, max)
            setSlice(slice)
        }
        if (sidebarType === "nsfw") {
            const slice = reverseSort ? nsfwImages.slice(Math.max(nsfwImages.length - max - 1, 0), nsfwImages.length - 1) : nsfwImages.slice(0, max)
            setSlice(slice)
        }
        if (sidebarType === "image") {
            const slice = reverseSort ? imageInputImages.slice(Math.max(imageInputImages.length - max - 1, 0), imageInputImages.length - 1) : imageInputImages.slice(0, max)
            setSlice(slice)
        }
        if (sidebarType === "saved") {
            let saved = localStorage.getItem("saved") || "[]" as any
            saved = JSON.parse(saved)
            const slice = reverseSort ? saved.slice(Math.max(saved.length - max - 1, 0), saved.length - 1) : saved.slice(0, max)
            setSlice(slice)
        }
    }, [sidebarType, images, nsfwImages, imageInputImages, reverseSort, sliceIndex])

    const handleScroll = (event: Event) => {
        if(!slice.length) return
        if (scrollLock) return
        if (Math.abs(document.body.scrollHeight - (document.body.scrollTop + document.body.clientHeight)) <= 1) {
            scrollLock = true
            setSliceIndex((prev: number) => prev + 1)
            setTimeout(() => {
                scrollLock = false
            }, 1000)
        }
    }

    useEffect(() => {
        document.body.addEventListener("scroll", handleScroll)
        return () => {
            document.body.removeEventListener("scroll", handleScroll)
        }
    }, [slice])

    const historyJSX = () => {
        let jsx = [] as any 
        if (reverseSort) {
            for (let i = slice.length - 1; i >= 0; i--) {
                jsx.push(<Image img={slice[i]}/>)
            }
        } else {
            for (let i = 0; i < slice.length; i++) {
                jsx.push(<Image img={slice[i]}/>)
            }
        }
        return jsx
    }

    const viewJSX = () => {
        let jsx = [] as any 
        if (reverseSort) {
            for (let i = viewImages.length - 1; i >= 0; i--) {
                jsx.push(<Image img={viewImages[i]}/>)
            }
        } else {
            for (let i = 0; i < viewImages.length; i++) {
                jsx.push(<Image img={viewImages[i]}/>)
            }
        }
        return jsx
    }

    const imageHistoryJSX = () => {
        if (tab === "view") return viewJSX()
        return historyJSX()
    }

    return (
        <div className="image-history" onMouseEnter={() => setEnableDrag(false)}>
            {imageHistoryJSX()}
        </div>
    )
}

export default ImageHistory