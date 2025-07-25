import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchData } from "@/config";
import {
  PaperclipIcon,
  PlusCircleIcon,
  FileIcon,
  Download,
  VideoIcon,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import socket from "@/socket";
import { Label } from "@/components/ui/label";
import VideoCall from "./call";
//import { ModeToggle } from "@/components/mode-toggle";

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [recieverId, setRecieverId] = useState("");
  const [chatId, setChatId] = useState("");
  const [msg, setMsg] = useState("");
  const [recieverName, setRecieverName] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [receiverSocketId, setReceiverSocketId] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const prevChatIdRef = useRef("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchChats = async () => {
    const res = await fetchData("/chat", "GET", {}, { authorization: `${token}` });
    if (res.status === 200) {
      setChats(res.data);
      console.log("Chats data:", res.data);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const initiateCall = async () => {
    const response = await fetchData(`/getSocketId?userId=${recieverId}`, "GET", {}, {});
    if (response.status === 200) {
      setReceiverSocketId(response?.data?.socketId);
      setIsCalling(true);
    } else {
      alert("User is not online");
    }
  };

  useEffect(() => {
    socket.emit("register", token);
  }, []);

  useEffect(() => {
    if (chatId && socket) {
      if (prevChatIdRef.current && prevChatIdRef.current !== chatId) {
        socket.emit("leave-chat", { chatId: prevChatIdRef.current });
      }

      socket.emit("join-chat", { chatId });
      prevChatIdRef.current = chatId;

      socket.on("receive-message", (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);
      });
    }

    return () => {
      socket.off("receive-message");
    };
  }, [chatId]);

  const handleAddUser = async () => {
    const res = await fetchData(
      "/add-user",
      "POST",
      { email },
      { authorization: `${token}` }
    );
    if (res.status === 200) {
      await fetchChats();
      setOpen(false);
    } else {
      alert(res.data.err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }
    setSelectedFile(file);
    setPreviewDialog(true);
  };

  const sendMessage = async () => {
    let fileName = null;
    let fileData = null;

    if (selectedFile) {
      fileName = selectedFile.name;
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = () => {
        fileData = reader.result.split(",")[1];

        socket.emit("send-message", {
          recieverId,
          chatId,
          message: msg,
          token,
          fileName,
          fileData,
        });

        setMsg("");
        setSelectedFile(null);
      };
    } else {
      socket.emit("send-message", {
        recieverId,
        chatId,
        message: msg,
        token,
      });

      setMsg("");
    }
  };

  const getMessage = async () => {
    const res = await fetchData(
      `/getmsg?chatId=${chatId}`,
      "GET",
      {},
      { authorization: `${token}` }
    );
    if (res.status === 200) {
      setMessages(res.data.Messages);
      setRecieverName(res.data.name);
    }
  };

  useEffect(() => {
    if (chatId) {
      getMessage();
    }
  }, [chatId]);

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewDialog(false);
  };

  const renderFilePreview = (fileBuffer, fileName) => {
    const fileType = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp"].includes(fileType)) {
      return (
        <Dialog>
          <DialogTrigger>
            <div className="w-32 h-32 bg-green-100 dark:bg-green-900 p-2 rounded-lg">
              <img
                src={`data:image/${fileType};base64,${fileBuffer}`}
                alt={fileName}
                className="w-full h-full object-cover rounded"
              />
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{fileName}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center">
              <img
                src={`data:image/${fileType};base64,${fileBuffer}`}
                alt={fileName}
                className="w-full h-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <FileIcon className="w-8 h-8 text-foreground" />
        <a
          href={`data:application/octet-stream;base64,${fileBuffer}`}
          download={fileName}
        >
          <Button>
            <Download className="mr-2 h-4 w-4" /> 
            {fileName.length > 15 ? fileName.slice(0, 15) + "..." : fileName}
          </Button>
        </a>
      </div>
    );
  };

  return !isCalling && !receiverSocketId ? (
    <div className="flex w-screen h-screen bg-background text-foreground">
      <div
        className={`${isMobile && chatId && "hidden"} flex flex-col ${
          !isMobile && "border-r"
        } border-border ${isMobile ? "w-full" : "w-[30%]"} h-screen bg-background`}
      >
        <div className="flex justify-between border-b border-border w-full px-5 py-2 bg-background">
          <h1 className="text-3xl font-semibold text-foreground">Chats</h1>
          {/* <ModeToggle /> */}
        </div>

        <div className="flex flex-col px-5 py-2 gap-5 mt-5 overflow-y-auto">
          {chats?.Chats?.flatMap((chatGroup) =>
            chatGroup?.connectedUsers?.map((chat, index) => (
              <div
                key={`${chat._id}-${index}`}
                className="flex flex-col gap-1 cursor-pointer p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => {
                  setChatId(chat._id);
                  setRecieverId(chat.user);
                }}
              >
                <div className="flex justify-between">
                  <h2 className="text-xl font-semibold text-foreground">{chat.name}</h2>
                  <p className="text-sm text-muted-foreground">{chat.lastMessageTime}</p>
                </div>
                <p className="text-sm text-muted-foreground">{chat.lastMessage}</p>
              </div>
            ))
          )}
        </div>

        <Dialog open={open} onOpenChange={() => setOpen(!open)}>
          <DialogTrigger>
            <div
              className={`fixed bottom-4 ${isMobile ? "right-4" : "right-[72%]"} cursor-pointer`}
              onClick={() => setOpen(true)}
            >
              <PlusCircleIcon className="w-[50px] h-[50px] text-primary hover:text-primary/80 transition-colors" />
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User to your Chat List</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                type="email"
                placeholder="Enter Email of User"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleAddUser}>Add User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {chatId && (
        <div className={`flex flex-col ${isMobile ? "w-full" : "w-[70%]"} h-screen bg-background`}>
          <div className="flex justify-between items-center border-b border-border w-full px-5 py-2.5 bg-background">
            <h1 className="flex gap-2 items-center text-2xl font-semibold text-foreground">
              {isMobile && (
                <ArrowLeft 
                  className="cursor-pointer hover:text-primary transition-colors" 
                  onClick={() => setChatId("")} 
                />
              )} 
              {recieverName}
            </h1>
            <div className="flex gap-5">
              <VideoIcon 
                className="cursor-pointer text-primary hover:text-primary/80 transition-colors" 
                onClick={initiateCall} 
              />
            </div>
          </div>

          <div className="flex flex-col w-full gap-5 px-5 py-2 h-[80vh] overflow-auto bg-background">
            {messages.map((message, index) => (
              <div
                key={`${message._id}-${index}`}
                className={`w-full flex ${message.recieverId === recieverId ? "justify-end" : ""}`}
              >
                {message.message && (
                  <p
                    className={`text-lg py-2 px-4 rounded-md max-w-[60%] ${
                      message.recieverId === recieverId 
                        ? "text-primary-foreground bg-primary ml-auto" 
                        : "text-secondary-foreground bg-secondary"
                    }`}
                  >
                    {message.message}
                  </p>
                )}
                {message.fileData && renderFilePreview(message.fileData, message.fileName)}
              </div>
            ))}
          </div>

          <div className="flex gap-2 px-5 py-2 border-t border-border bg-background">
            <div className="flex items-center">
              <Label htmlFor="file" className="cursor-pointer">
                <PaperclipIcon className="text-muted-foreground hover:text-foreground transition-colors" />
              </Label>
              <Input
                id="file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <Input
              placeholder="Type a message"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              className="flex-1"
            />

            <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
              <DialogContent>
                {selectedFile && (
                  <div className="flex flex-col items-center mt-4">
                    {selectedFile.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="preview"
                        className="w-32 h-32 object-cover mb-2 rounded"
                      />
                    ) : (
                      <FileIcon className="w-16 h-16 mb-2 text-muted-foreground" />
                    )}
                    <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>

                    <div className="flex gap-2 mt-4">
                      <Button variant="secondary" onClick={handleRemoveFile}>
                        Remove
                      </Button>
                      <Button
                        onClick={() => {
                          setPreviewDialog(false);
                          sendMessage();
                        }}
                      >
                        Confirm & Send
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button onClick={sendMessage}>Send</Button>
          </div>
        </div>
      )}
    </div>
  ) : (
    <VideoCall
      socketId={receiverSocketId}
      onCallEnd={() => {
        setIsCalling(false);
        setReceiverSocketId("");
      }}
    />
  );
};

export default Chat;