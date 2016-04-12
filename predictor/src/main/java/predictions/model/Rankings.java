package predictions.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Rankings {
	
	private List<User> data;
	
	
	
	public Rankings(List<User> data) {
		super();
		this.data = data;
	}



	@JsonProperty
	public List<User> getData() {
		return data;
	}
	

}
