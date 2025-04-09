import System from "./Terminal";
import Help from "./Help";
import About from "./About";
import Clear from "./Clear";
import Exit from "./Exit";

System.addApp(new Help());
System.addApp(new About());
System.addApp(new Clear());
System.addApp(new Exit());