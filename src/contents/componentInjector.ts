import { Storage } from "@plasmohq/storage"

import { insertEvaluationComponent } from "../components/evaluation"
import { injectMainComponent } from "../components/main"
import { injectScanningProgress } from "../components/progress.component"
import { JOB_RUNNING } from "../config/storage.config"
import { waitForElement } from "~src/utils/wait-for.utils"
import { PROFILE_SELECTORS } from "~src/types"

import { handleMutation } from './mutationHandler'

const storage = new Storage()

let mainObserver = null
let previousURL = ""

async function injectEvaluationResults() {
	const listElementSelector = PROFILE_SELECTORS.listElement
	const parentSelector = PROFILE_SELECTORS.parent

	let listObserver = null // Variable to store the current observer for the list

	// Function to observe the OL element
	const observeListElement = () => {
		if (listObserver) {
			listObserver.disconnect() // Disconnect any existing observer
			console.log("Previous list evaluation result observer disconnected.")
		}

		const olElement = document.querySelector(listElementSelector)
		if (!olElement) {
			console.warn("OL element not found:", listElementSelector)
			return
		}

		listObserver = new MutationObserver((mutations) =>
			mutations.forEach(handleMutation)
		)

		listObserver.observe(olElement, {
			attributes: true,
			attributeOldValue: true,
			attributeFilter: ["class"],
			subtree: true
		})
		console.log("profile evaluation observer connected.")
	}

	// Observe the parent element for the addition or removal of the OL element
	const parentObserver = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			// @ts-ignore
			if (mutation.type === "childList" || mutation.type === "subtree") {
				const hasOlElement = Array.from(mutation.addedNodes)
					.concat(Array.from(mutation.removedNodes))
					.some(
						(node) =>
							node instanceof Element &&
							node.matches &&
							node.matches(listElementSelector)
					)

				if (hasOlElement) {
					observeListElement()
				}
			}
		})
	})

	// Wait for the parent element before setting up the observer
	await waitForElement(parentSelector)
	const parentElement = document.querySelector(parentSelector)
	if (!parentElement) {
		console.error("Parent element not found:", parentSelector)
		return
	}

	parentObserver.observe(parentElement, { childList: true, subtree: true })

	// Initial observation of the OL element
	await waitForElement(listElementSelector)
	// console.log("Initial OL is available")
	observeListElement()
}

export const injectComponents = () => {
	if (mainObserver) mainObserver.disconnect()

	const targetNode = document.getElementsByTagName("body")[0]

	const config = { attributes: false, childList: true, subtree: true }

	const callback = (mutationList, observer) => {
		for (const mutation of mutationList) {
			if (
				mutation.type === "childList" ||
				mutation.type === "subtree" ||
				mutation.type === "attributes"
			) {
				const currentURL = window.location.href
				if (currentURL !== previousURL) {
					console.log("URL changed to:", currentURL)
					previousURL = currentURL
					storage.get(JOB_RUNNING).then((isRunning) => {
						console.log("IS JOB RUNNING: ", isRunning)
						if (isRunning) injectScanningProgress()
					})
					injectMainComponent()
					insertEvaluationComponent({
						querySelectorTargetElement: ".sourcing-channels__post-job-link",
						position: "after"
					})
					insertEvaluationComponent({
						querySelectorTargetElement: ".candidate-filtering-bar__container",
						position: "appendChild",
						style: { marginTop: 0, marginLeft: 1 }
					})
					injectEvaluationResults()
				}
			}
		}
	}

	mainObserver = new MutationObserver(callback)
	mainObserver.observe(targetNode, config)
}