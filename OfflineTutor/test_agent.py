import unittest
from unittest.mock import patch, MagicMock
from agent import SocraticAgent

class TestSocraticAgent(unittest.TestCase):
    @patch('agent.genai.Client')
    @patch('agent.subprocess.run')
    def test_sufficient_context(self, mock_subprocess, mock_genai_client):
        # Setup mock client
        mock_client_instance = MagicMock()
        mock_genai_client.return_value = mock_client_instance
        
        # Setup first generation response (sufficient context -> YES)
        mock_response_1 = MagicMock()
        mock_response_1.text = "YES"
        
        # Setup second generation response (socratic answer)
        mock_response_2 = MagicMock()
        mock_response_2.text = "What do you think is the output?"
        
        mock_client_instance.models.generate_content.side_effect = [mock_response_1, mock_response_2]
        
        agent = SocraticAgent(api_key="test")
        response = agent.generate_response("What is the output of print('Hello')?", "The print function outputs the string to stdout.")
        
        # Assertions
        self.assertEqual(response, "What do you think is the output?")
        mock_subprocess.assert_not_called()
        self.assertEqual(mock_client_instance.models.generate_content.call_count, 2)
        
    @patch('agent.genai.Client')
    @patch('agent.subprocess.run')
    def test_insufficient_context(self, mock_subprocess, mock_genai_client):
        # Setup mock client
        mock_client_instance = MagicMock()
        mock_genai_client.return_value = mock_client_instance
        
        # Setup first generation response (insufficient context -> NO)
        mock_response_1 = MagicMock()
        mock_response_1.text = "NO"
        
        # Setup second generation response (socratic answer)
        mock_response_2 = MagicMock()
        mock_response_2.text = "Can you think of any recent news?"
        
        mock_client_instance.models.generate_content.side_effect = [mock_response_1, mock_response_2]
        
        # Setup mock subprocess
        mock_process = MagicMock()
        mock_process.returncode = 0
        mock_process.stdout = "This is a search result."
        mock_subprocess.return_value = mock_process
        
        agent = SocraticAgent(api_key="test")
        response = agent.generate_response("What happened in the world today?", "Python is a programming language.")
        
        # Assertions
        self.assertEqual(response, "Can you think of any recent news?")
        mock_subprocess.assert_called_once()
        self.assertEqual(mock_client_instance.models.generate_content.call_count, 2)
        
        # Check if subprocess was called with correct command
        command = mock_subprocess.call_args[0][0]
        self.assertEqual(command, ["keenable", "search", "What happened in the world today?", "-p"])

if __name__ == '__main__':
    unittest.main()
