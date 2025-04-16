import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { sendEmail } from "../email";

describe("email", () => {
    const originalEnv = process.env;
    const CHES_AUTH_URL = "https://mocked-token-url";
    const CHES_EMAIL_URL = "https://mocked-email-url";
    const chesAccessToken = "test_access_token";
    const responseOk = {
        ok: true,
        statusText: "OK",
        status: 200,
    };
    const responseServerErr = {
        ok: false,
        statusText: "Internal Server Error",
        status: 500,
    }

    const testReceipientEmails = ["test1@email.com", "test2@email.com"];
    const testSubject = "Test Subject";
    const testBodyType = "html";
    const testBody = "<p>Test Email Body</p>";

    let mockedFetchRequests: Record<string, (data: any) => Response> = {};

    beforeEach(() => {    
        jest.resetModules(); // Clear the module registry
        process.env.CHES_AUTH_URL = CHES_AUTH_URL;
        process.env.CHES_EMAIL_URL = CHES_EMAIL_URL;
        process.env.EMAIL_SERVICE_CLIENT_ID = "mocked-client-id";
        process.env.EMAIL_SERVICE_CLIENT_SECRET = "mocked-client-secret";
        process.env.SENDER_EMAIL = "mocked-sender-email";
        process.env.SENDER_NAME = "mocked-sender-name";

        mockedFetchRequests = {
            [CHES_AUTH_URL]: (data) => {
                expect(data.method).toBe("POST");
                return {
                    ...responseOk,
                    json: () => Promise.resolve({ access_token: chesAccessToken }),
                } as Response
            },
        };

        global.fetch = jest.fn((url, data): Promise<Response> => {
            const fetchRequest = mockedFetchRequests[url as string];
            if (!fetchRequest) {
                throw new Error(`No fetch request found for URL: ${url}`);
            }
            return Promise.resolve(fetchRequest(data));
        });

        console.error = jest.fn(); // Mock console.error to prevent actual error logging
        console.log = jest.fn(); // Mock console.log to prevent actual logging
    });

    afterEach(() => {
        process.env = { ...originalEnv }; // Restore original environment variables
        jest.restoreAllMocks(); // Restore original implementations of mocked functions
    });

    it("should send email successfully", async () => {
        mockedFetchRequests[CHES_EMAIL_URL] = (data) => {
            expect(data.method).toBe("POST");
            expect(data.headers["Authorization"]).toBe(`Bearer ${chesAccessToken}`);
            const body = JSON.parse(data.body as string);
            expect(body.from).toBe("mocked-sender-name <mocked-sender-email>");
            expect(body.bcc).toEqual(testReceipientEmails);
            expect(body.subject).toBe(testSubject);
            expect(body.bodyType).toBe(testBodyType);
            expect(body.body).toBe(testBody);
            return {
                ...responseOk,
                json: () => Promise.resolve({ message: "Email sent successfully" }),
            } as Response;
        };

        const result = await sendEmail(testReceipientEmails, testSubject, testBodyType, testBody);
        expect(result).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should fail to send email if email url is not set", async () => {
        delete process.env.CHES_EMAIL_URL;
        const result = await sendEmail(testReceipientEmails, testSubject, testBodyType, testBody);
        expect(result).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
    });

    it("should fail to send email if sender email is not set", async () => {
        delete process.env.SENDER_EMAIL;
        const result = await sendEmail(testReceipientEmails, testSubject, testBodyType, testBody);
        expect(result).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
    });

    it("should fail to send email if sender name is not set", async () => {
        delete process.env.SENDER_NAME;
        const result = await sendEmail(testReceipientEmails, testSubject, testBodyType, testBody);
        expect(result).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
    });

    it("should fail to send email if client_id is not set", async () => {
        delete process.env.EMAIL_SERVICE_CLIENT_ID;
        const result = await sendEmail(testReceipientEmails, testSubject, testBodyType, testBody);
        expect(result).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
    });

    it("should fail to send email if client_secret is not set", async () => {
        delete process.env.EMAIL_SERVICE_CLIENT_SECRET;
        const result = await sendEmail(testReceipientEmails, testSubject, testBodyType, testBody);
        expect(result).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
    });

    it("should fail to send email if auth url is not set", async () => {
        delete process.env.CHES_AUTH_URL;
        const result = await sendEmail(testReceipientEmails, testSubject, testBodyType, testBody);
        expect(result).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
    });

    it("should fail to send email if server error in getting access token", async () => {
        mockedFetchRequests[CHES_AUTH_URL] = () => ({
            ...responseServerErr,
            json: () => Promise.resolve({ message: "Unable to get access token" }),
        }) as Response;
        const result = await sendEmail(testReceipientEmails, testSubject, testBodyType, testBody);
        expect(result).toBe(false);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalled();
    });

    it("should fail to send email if access token is missing", async () => {
        mockedFetchRequests[CHES_AUTH_URL] = () => ({
            ...responseOk,
            json: () => Promise.resolve(),
        }) as Response;
        const result = await sendEmail(testReceipientEmails, testSubject, testBodyType, testBody);
        expect(result).toBe(false);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalled();
    });

    it("should handle server error during email sending", async () => {
        mockedFetchRequests[CHES_EMAIL_URL] = () => ({
            ...responseServerErr,
            json: () => Promise.resolve({ message: "Unable to send email" }),
        }) as Response;

        const result = await sendEmail(testReceipientEmails, testSubject, testBodyType, testBody);
        expect(result).toBe(false);
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(console.error).toHaveBeenCalled();
    });
});
