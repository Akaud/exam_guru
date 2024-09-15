import React, {useEffect, useState} from 'react';

const App=()=> {
    const [message,setMessage]=useState('');
    const getWelcomeMessage = async()=>{
        const requestOptions={
            method:'GET',
            headers:{
                "Content-Type": "application/json",
            },
        };
        // const response=await fetch("/api",requestOptions);
        const response = await fetch("/api", {
            headers:{
            accept: 'application/json',
            'User-agent': 'learning app',
        }
});
        const data = response.json();
        if(!response.ok){
            console.log("error");
        }else{
            setMessage(data.message);
        }
    }
    useEffect(() => {
        getWelcomeMessage();
    },[])
  return (
      <div>
          <h1>{message}</h1>
      </div>
  );
}
export default App;
