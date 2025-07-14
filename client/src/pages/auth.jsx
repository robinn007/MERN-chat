import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchData } from "@/config";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BeatLoader } from "react-spinners";

const Auth = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("user@gmail.com");
  const [password, setPassword] = useState("user1234");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

   const handleLogin = async () => {
    setIsLoading(true);
    const res = await fetchData("/auth/login", "POST", { email, password });
    setIsLoading(false);
    if (res.status === 200) {
      const token = res.data.token;
      localStorage.setItem("token", token);
      navigate("/chat");
    } else {
      alert("Invalid credentials");
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      setIsLoading(false);
      return;
    }

     const res = await fetchData("/auth/signup", "POST", { name, email, password });
    setIsLoading(false);
    if (res.status === 200) {
      alert("Signup successful");
    } else if (res.status === 409) {
      alert("User already exists");
    } else {
      alert("Some error occurred");
    }
  };

  return (
       <div className="flex flex-col justify-center items-center min-h-screen">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="w-full">
          <TabsTrigger value="login" className="w-full font-bold">
            Login
          </TabsTrigger>
          <TabsTrigger value="signup" className="w-full font-bold">
            Signup
          </TabsTrigger>
        </TabsList>
        <TabsContent value="login" className="flex flex-col gap-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="w-full" onClick={() => !isLoading && handleLogin()}>
            {isLoading ? <BeatLoader /> : "Login"}
          </Button>
        </TabsContent>
          <TabsContent value="signup" className="flex flex-col gap-3">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button className="w-full" onClick={() => !isLoading && handleSignup()}>
            {isLoading ? <BeatLoader /> : "Signup"}
          </Button>
           </TabsContent>
      </Tabs>
    </div>
  );
}

export default Auth;
