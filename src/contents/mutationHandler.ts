import {
	htmlClassInvisibleProfile,
	htmlClassVisibleProfile
} from "../utils/constants.utils"
import { generateMD5 } from "../utils/hash.utils"
import { ActionTypes } from "../types"
import { getEvaluationFromIndexedDB } from "../utils/storage.utils"
import { injectDataIntoDom } from "../utils/dom-manipulation.utils"

// Fetches evaluation data from IndexedDB
async function fetchEvaluationData(projectId, jobDescriptionId, profileId) {
	try {
		return await getEvaluationFromIndexedDB(projectId, jobDescriptionId, profileId);
	} catch (error) {
		console.error("Error fetching data from indexedDB:", error);
		throw error;
	}
}

// Fetches job data
const fetchJobData = () => {
	return new Promise((resolve) => {
		chrome.runtime.sendMessage({ action: ActionTypes.GET_JOB_DETAILS }, (response) => {
			resolve(response.data || {});
		});
	});
}

// Checks if a profile is visible
function checkIfProfileIsVisible(oldClass: string, currentClass: string): boolean {
	return oldClass === htmlClassInvisibleProfile && currentClass === htmlClassVisibleProfile;
}

// Extracts project and profile IDs from an element
function getProjectAndProfileIds(element: Element): { projectId: string, profileId: string } {
	const projectId = window.location.href.match(/\/(\d+)\//)?.[1];
	const profileId = element.querySelector("a").href.match(/profile\/(.*?)\?/)[1];
	return { projectId, profileId };
}

// Fetches job description ID
async function fetchJobDescriptionId(projectId: string): Promise<string> {
	const jobData: any = await fetchJobData();
	const jobDescription = jobData?.[projectId]?.description || "";
	return generateMD5(jobDescription);
}

// Handles found evaluation data
function handleFoundEvaluationData(element: Element, evaluationData: any[]): void {
	injectDataIntoDom(element, evaluationData[0]);
}

// Sets up a listener when no evaluation data is found
function setupListenerWhenNoEvaluationData(element: Element): void {
	const listenerFunction = async (message, sender, sendResponse) => {
		const { projectId, profileId } = getProjectAndProfileIds(element);
		const jobDescriptionId = await fetchJobDescriptionId(projectId);
		if (message.action === ActionTypes.ITEM_ADDED) {
			console.log("setupListenerWhenNoEvaluationData ====== ITEM_ADDED")
			const newData = await getEvaluationFromIndexedDB(projectId, jobDescriptionId, profileId);
			if (Array.isArray(newData) && newData.length) {
				injectDataIntoDom(element, newData[0]);
				chrome.runtime.onMessage.removeListener(listenerFunction);
			}
		}
		sendResponse();
	};
	chrome.runtime.onMessage.addListener(listenerFunction);
}

// Handles mutations
export async function handleMutation(mutation) {
	if (mutation.type !== "attributes" || mutation.target.tagName !== "LI") {
		return;
	}

	const mutatedElement = mutation.target;
	const currentClass = mutatedElement.getAttribute("class");
	const oldClass = mutation.oldValue;

	if (!checkIfProfileIsVisible(oldClass, currentClass)) {
		return;
	}

	try {
		const { projectId, profileId } = getProjectAndProfileIds(mutatedElement);
		const jobDescriptionId = await fetchJobDescriptionId(projectId);
		const evaluationData = await fetchEvaluationData(projectId, jobDescriptionId, profileId);

		if (Array.isArray(evaluationData) && evaluationData.length) {
			handleFoundEvaluationData(mutatedElement, evaluationData);
		} else {
			// console.log("setupListenerWhenNoEvaluationData")
			setupListenerWhenNoEvaluationData(mutatedElement);
		}
	} catch (error) {
		console.error("Error get-job-details from backgrounds script:", error);
	}
}